import { WebSocketServer, WebSocket } from 'ws';
import { Server, IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { Contract } from '../models/Contract.model.js';

interface ClientSocket extends WebSocket {
  userId?: string;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  room?: string;
  isAlive?: boolean;
}

let globalWss: WebSocketServer | null = null;

export function broadcastSystemNotification(notification: {
  title: string;
  message: string;
  senderName?: string;
  senderAvatar?: string;
  type?: string;
  tab?: string;
}) {
  if (!globalWss) return;
  const payload = JSON.stringify({
    type: 'system_notification',
    payload: {
      ...notification,
      id: `sys-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    },
  });

  globalWss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });
  globalWss = wss;

  const broadcastOnlineUsers = () => {
    const onlineMap: Record<string, { userId: string; name: string; role?: string; avatarUrl?: string }> = {};
    wss.clients.forEach((client) => {
      const target = client as ClientSocket;
      if (target.readyState === WebSocket.OPEN && target.userId) {
        onlineMap[target.userId] = {
          userId: target.userId,
          name: target.userName || 'User',
          role: target.userRole,
          avatarUrl: target.userAvatar,
        };
      }
    });

    const onlineList = Object.values(onlineMap);
    const msg = JSON.stringify({ type: 'online_users', users: onlineList });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  };

  wss.on('connection', (ws: ClientSocket, req: IncomingMessage) => {
    ws.isAlive = true;

    // Check if token is passed via query string (?token=...)
    try {
      if (req.url && req.url.includes('token=')) {
        const urlParams = new URL(req.url, 'http://localhost:5001');
        const token = urlParams.searchParams.get('token');
        if (token) {
          const decoded: any = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
          ws.userId = decoded.id;
          ws.userName = decoded.name || decoded.email;
          ws.userRole = decoded.role;
        }
      }
    } catch (e) {
      // Allow unauthenticated connection or subsequent 'auth' message
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'auth':
            if (message.token) {
              try {
                const decoded: any = jwt.verify(message.token, ENV.JWT_ACCESS_SECRET);
                ws.userId = decoded.id;
                ws.userName = message.userName || decoded.name || decoded.email;
                ws.userRole = message.userRole || decoded.role;
                ws.userAvatar = message.userAvatar;
                broadcastOnlineUsers();
              } catch (err) {
                ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid JWT' }));
              }
            }
            break;

          case 'join_room':
          case 'presence':
            (async () => {
              const requestedRoom = message.room || 'project_general';
              const effectiveUserId = ws.userId || message.userId;

              if (requestedRoom.startsWith('contract:') || requestedRoom.startsWith('workspace:')) {
                const targetContractId = requestedRoom.split(':')[1];
                if (!targetContractId || !mongoose.Types.ObjectId.isValid(targetContractId)) {
                  ws.send(JSON.stringify({ type: 'room_join_error', room: requestedRoom, error: 'Invalid contract ID' }));
                  return;
                }

                if (!effectiveUserId) {
                  ws.send(JSON.stringify({ type: 'room_join_error', room: requestedRoom, error: 'Authentication required' }));
                  return;
                }

                try {
                  const contract = await Contract.findById(targetContractId);
                  if (!contract) {
                    ws.send(JSON.stringify({ type: 'room_join_error', room: requestedRoom, error: 'Contract not found' }));
                    return;
                  }

                  const isClient = contract.clientId.toString() === effectiveUserId.toString();
                  const isFreelancer = contract.freelancerId.toString() === effectiveUserId.toString();
                  const isAdmin = ws.userRole === 'admin';

                  if (!isClient && !isFreelancer && !isAdmin) {
                    ws.send(JSON.stringify({
                      type: 'room_join_error',
                      room: requestedRoom,
                      error: 'Access denied: You are not an authorized participant in this project workspace.',
                    }));
                    return;
                  }
                } catch (e) {
                  ws.send(JSON.stringify({ type: 'room_join_error', room: requestedRoom, error: 'Verification failed' }));
                  return;
                }
              }

              ws.room = requestedRoom;
              ws.userId = effectiveUserId;
              ws.userName = message.userName || message.name || ws.userName;
              ws.userRole = message.userRole || message.role || ws.userRole;
              ws.userAvatar = message.userAvatar || message.avatarUrl || ws.userAvatar;
              ws.send(JSON.stringify({ type: 'room_joined', room: ws.room }));
              broadcastOnlineUsers();
            })();
            break;

          case 'chat_message':
            // Broadcast message to everyone in the room
            wss.clients.forEach((client) => {
              const target = client as ClientSocket;
              if (
                target !== ws &&
                target.readyState === WebSocket.OPEN &&
                (!ws.room || target.room === ws.room)
              ) {
                target.send(JSON.stringify({ type: 'new_message', payload: message.payload }));
              }
            });
            break;

          // WebRTC Audio/Video Call Signaling & Ringing Invitations
          case 'call_user':
          case 'call_accepted':
          case 'call_declined':
          case 'call_ended':
          case 'webrtc_offer':
          case 'webrtc_answer':
          case 'webrtc_ice_candidate':
            wss.clients.forEach((client) => {
              const target = client as ClientSocket;
              if (target !== ws && target.readyState === WebSocket.OPEN) {
                // If targeted to a specific user, route directly to that user's socket
                if (message.targetUserId && target.userId !== message.targetUserId) {
                  return;
                }
                // If targeted to a specific room, route only within that room
                if (message.room && target.room && target.room !== message.room) {
                  return;
                }
                target.send(JSON.stringify(message));
              }
            });
            break;

          case 'broadcast_toast':
            wss.clients.forEach((client) => {
              const target = client as ClientSocket;
              if (target !== ws && target.readyState === WebSocket.OPEN) {
                target.send(JSON.stringify({ type: 'toast_alert', payload: message.payload }));
              }
            });
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('[FLOXA Work WS Error]:', err);
      }
    });

    ws.on('close', () => {
      broadcastOnlineUsers();
    });
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((client) => {
      const socket = client as ClientSocket;
      if (socket.isAlive === false) {
        return socket.terminate();
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(heartbeat);
  });

  return wss;
}
