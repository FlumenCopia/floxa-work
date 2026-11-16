'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AuthScreen, AuthUser } from '@/components/auth/AuthScreen';
import { FloxaWorkShell, FloxaWorkTab, FloxaNotification } from '@/components/FloxaWorkShell';
import { ClientDashboard } from '@/components/ClientDashboard';
import { BriefsView, ClientBrief } from '@/components/BriefsView';
import { FeedView } from '@/components/FeedView';
import { WorkspaceView } from '@/components/WorkspaceView';
import { ChatView, ChatMessageItem } from '@/components/ChatView';
import { MiniDiscoveryModal } from '@/components/MiniDiscoveryModal';
import { PostBriefModal } from '@/components/PostBriefModal';
import { ProfileView } from '@/components/ProfileView';
import { PaymentLedgerView } from '@/components/PaymentLedgerView';
import { AdminPortal } from '@/components/AdminPortal';
import { DiscoveryView } from '@/components/DiscoveryView';
import {
  MessageSquare,
  ArrowRight,
  Inbox,
  Phone,
  PhoneOff,
  Video,
  X,
  Bell,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { fetchMyProposals, clearAuthSession, fetchChatMessages, sendChatMessage } from '@/lib/api';
import { RingtonePlayer, playNotificationPing } from '@/lib/audio';

interface FloatingToast {
  id: string;
  type: 'chat' | 'proposal' | 'milestone' | 'call' | 'info';
  title: string;
  senderName?: string;
  senderAvatar?: string;
  message: string;
  timestamp: string;
  tab?: FloxaWorkTab;
}

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentTab, setCurrentTab] = useState<FloxaWorkTab>('briefs');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedBriefForPitch, setSelectedBriefForPitch] = useState<ClientBrief | null>(null);
  const [isPostBriefOpen, setIsPostBriefOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Dynamic Proposals
  const [myProposals, setMyProposals] = useState<any[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);

  // =========================================================================
  // GLOBAL REAL-TIME WEBSOCKET & CALLING STATE (PERSISTENT ACROSS ENTIRE APP)
  // =========================================================================
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const ringtoneRef = useRef<RingtonePlayer>(new RingtonePlayer());

  // Call states: 'idle' | 'calling' (outgoing) | 'ringing' (incoming) | 'connected' | 'declined'
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'declined'>('idle');
  const [incomingCallData, setIncomingCallData] = useState<{
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    callType?: string;
  } | null>(null);

  // Chat messages synced globally
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Rich floating toasts & notification center
  const [floatingToasts, setFloatingToasts] = useState<FloatingToast[]>([]);
  const [notifications, setNotifications] = useState<FloxaNotification[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Peer metadata defaults
  const isClient = currentUser?.role === 'client';
  const isAdmin = currentUser?.role === 'admin';
  const peerName = isClient ? 'Aravind V.' : 'Sanjay Mehta';
  const peerAvatar = isClient
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80';

  // Check saved session
  useEffect(() => {
    try {
      const saved = localStorage.getItem('floxa_work_user');
      const token = localStorage.getItem('floxa_work_jwt');
      if (saved && token) {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
        if (parsed.role === 'admin') {
          setCurrentTab('admin');
        } else {
          setCurrentTab(parsed.role === 'client' ? 'client_dashboard' : 'briefs');
        }
      } else {
        clearAuthSession();
        setCurrentUser(null);
      }
    } catch {
      clearAuthSession();
      setCurrentUser(null);
    }
  }, []);

  // Load proposals from database
  const loadProposals = async () => {
    setIsLoadingProposals(true);
    try {
      const data = await fetchMyProposals();
      setMyProposals(data);
    } catch {
      setMyProposals([]);
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // Register PWA Service Worker & Request Push Notification Permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[FLOXA Work PWA] ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[FLOXA Work PWA] ServiceWorker registration failed:', err);
        });

      if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
          Notification.requestPermission();
        }, 3000);
      }
    }
  }, []);

  const triggerDesktopNotification = (title: string, body: string) => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted' &&
      document.hidden
    ) {
      try {
        new Notification(title, {
          body,
          icon: '/android-chrome-192x192.png',
        });
      } catch {}
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadProposals();
    }
  }, [currentUser, refreshKey]);

  // Load chat history from database
  useEffect(() => {
    if (!currentUser) return;
    async function loadHistory() {
      try {
        const data = await fetchChatMessages();
        if (data && data.length > 0) {
          const formatted: ChatMessageItem[] = data.map((m: any) => ({
            id: m._id || m.id || String(Math.random()),
            senderId: m.senderId?._id || m.senderId?.id || m.senderId,
            senderName: m.senderId?.name || (currentUser && m.senderId === currentUser.id ? currentUser.name : peerName),
            text: m.text,
            createdAt: m.createdAt || new Date().toISOString(),
            isSelf: currentUser ? (m.senderId?._id || m.senderId?.id || m.senderId) === currentUser.id : false,
          }));
          setChatMessages(formatted);
        } else {
          setChatMessages([
            {
              id: 'init-1',
              senderId: 'peer',
              senderName: peerName,
              text: isClient
                ? 'Hello Sanjay! I have reviewed your project brief for the AI Clinical Platform. Looking forward to our milestone roadmap.'
                : 'Hi Aravind! Reviewed your Mini-Discovery diagnosis. The 3-archetype approach looks great.',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              isSelf: false,
            },
            {
              id: 'init-2',
              senderId: currentUser?.id || 'self',
              senderName: currentUser?.name || 'You',
              text: isClient
                ? 'Great! Can we align on Milestone 1 advance deliverables?'
                : 'Yes, we are set to execute Discovery & Brand Concept Exploration in Week 1.',
              createdAt: new Date(Date.now() - 1800000).toISOString(),
              isSelf: true,
            },
          ]);
        }
      } catch {}
    }
    loadHistory();
  }, [currentUser?.id]);

  // =========================================================================
  // PERSISTENT GLOBAL WEBSOCKET CONNECTION
  // =========================================================================
  useEffect(() => {
    if (!currentUser) return;

    let socket: WebSocket | null = null;
    let heartbeatTimer: any = null;
    let reconnectTimer: any = null;
    let isCleanedUp = false;

    function connect() {
      if (isCleanedUp) return;
      let wsUrl = process.env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${proto}//${window.location.host}/ws`;
        } else {
          wsUrl = 'ws://localhost:5001/ws';
        }
      }
      socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsWsConnected(true);
        // Announce presence immediately
        socket?.send(
          JSON.stringify({
            type: 'join_room',
            room: 'project_general',
            userId: currentUser?.id,
            userName: currentUser?.name,
            userRole: currentUser?.role,
            userAvatar: currentUser?.avatarUrl,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 1. Online Users Update
          if (data.type === 'online_users' && Array.isArray(data.users)) {
            setOnlineUsers(data.users);
          }

          // 2. Incoming Chat Message
          if (data.type === 'new_message' && data.payload) {
            const incoming = data.payload;
            const isSelf = incoming.senderId === currentUser?.id;

            setChatMessages((prev) => [
              ...prev,
              {
                id: incoming.id || String(Date.now()),
                senderId: incoming.senderId,
                senderName: incoming.senderName || peerName,
                text: incoming.text,
                createdAt: incoming.createdAt || new Date().toISOString(),
                isSelf,
              },
            ]);

            // If message is from someone else, trigger notification & toast
            if (!isSelf) {
              playNotificationPing();
              triggerDesktopNotification(
                'FLOXA Work: ' + (incoming.senderName || peerName),
                incoming.text
              );

              // Add rich floating toast
              triggerFloatingToast({
                type: 'chat',
                title: incoming.senderName || peerName,
                senderName: incoming.senderName || peerName,
                senderAvatar: peerAvatar,
                message: incoming.text,
                timestamp: 'Just now',
                tab: 'chat',
              });

              // Add to notification dropdown list
              const notifId = `msg-${Date.now()}`;
              setNotifications((prev) => [
                {
                  id: notifId,
                  type: 'chat',
                  title: incoming.senderName || peerName,
                  message: incoming.text,
                  senderName: incoming.senderName || peerName,
                  senderAvatar: peerAvatar,
                  timestamp: 'Just now',
                  read: false,
                  tab: 'chat',
                },
                ...prev.slice(0, 24),
              ]);

              setUnreadNotificationsCount((c) => c + 1);

              // Increment message badge if not currently on chat
              setCurrentTab((activeTab) => {
                if (activeTab !== 'chat') {
                  setUnreadMessagesCount((mc) => mc + 1);
                }
                return activeTab;
              });
            }
          }

          // 3. Incoming Call Ringing (Anywhere on the site!)
          if (data.type === 'call_user' && data.callerId !== currentUser?.id) {
            setIncomingCallData({
              callerId: data.callerId,
              callerName: data.callerName || peerName,
              callerAvatar: data.callerAvatar || peerAvatar,
              callType: data.callType || 'video',
            });
            setCallStatus('ringing');
            ringtoneRef.current.start(true); // Telephone incoming ring sound!
            triggerDesktopNotification(
              'FLOXA Work: Incoming Video Screening Call',
              `Incoming video call from ${data.callerName || peerName}`
            );

            triggerFloatingToast({
              type: 'call',
              title: 'Incoming Screening Call',
              senderName: data.callerName || peerName,
              senderAvatar: data.callerAvatar || peerAvatar,
              message: `Incoming video screening call from ${data.callerName || peerName}`,
              timestamp: 'Just now',
              tab: 'chat',
            });
          }

          // 4. Call Accepted
          if (data.type === 'call_accepted') {
            ringtoneRef.current.stop();
            setCallStatus('connected');
            setCurrentTab('chat'); // Switch caller and recipient directly to chat room!
            triggerFloatingToast({
              type: 'call',
              title: 'Call Connected',
              message: 'Live WebRTC screening session established.',
              timestamp: 'Just now',
              tab: 'chat',
            });
          }

          // 5. Call Declined
          if (data.type === 'call_declined') {
            ringtoneRef.current.stop();
            setCallStatus('declined');
            triggerFloatingToast({
              type: 'call',
              title: 'Call Declined',
              message: `${peerName} is currently unavailable.`,
              timestamp: 'Just now',
            });
            setTimeout(() => {
              setCallStatus('idle');
              setIncomingCallData(null);
            }, 2500);
          }

          // 6. Call Ended
          if (data.type === 'call_ended') {
            ringtoneRef.current.stop();
            setCallStatus('idle');
            setIncomingCallData(null);
          }

          // 7. System Notification (Proposals, Milestones)
          if (data.type === 'system_notification' && data.payload) {
            playNotificationPing();
            const sys = data.payload;
            triggerDesktopNotification(
              'FLOXA Work: ' + (sys.title || 'Platform Update'),
              sys.message
            );

            triggerFloatingToast({
              type: sys.type || 'info',
              title: sys.title || 'System Notification',
              senderName: sys.senderName,
              message: sys.message,
              timestamp: 'Just now',
              tab: sys.tab as FloxaWorkTab,
            });

            setNotifications((prev) => [
              {
                id: sys.id || `sys-${Date.now()}`,
                type: sys.type || 'info',
                title: sys.title || 'Update',
                message: sys.message,
                senderName: sys.senderName,
                timestamp: 'Just now',
                read: false,
                tab: sys.tab as FloxaWorkTab,
              },
              ...prev.slice(0, 24),
            ]);

            setUnreadNotificationsCount((c) => c + 1);
            setRefreshKey((k) => k + 1);
          }
        } catch (err) {
          console.error('[WS Parse error]:', err);
        }
      };

      socket.onclose = () => {
        setIsWsConnected(false);
        if (!isCleanedUp) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    // Heartbeat presence ping every 20s
    heartbeatTimer = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'presence',
            userId: currentUser?.id,
            userName: currentUser?.name,
            userRole: currentUser?.role,
          })
        );
      }
    }, 20000);

    return () => {
      isCleanedUp = true;
      ringtoneRef.current.stop();
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [currentUser?.id]);

  // Clear unread message count when visiting chat
  useEffect(() => {
    if (currentTab === 'chat') {
      setUnreadMessagesCount(0);
    }
  }, [currentTab]);

  // Trigger floating toast helper
  const triggerFloatingToast = (item: Omit<FloatingToast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: FloatingToast = { ...item, id };

    setFloatingToasts((prev) => [newToast, ...prev.slice(0, 3)]);

    setTimeout(() => {
      setFloatingToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // =========================================================================
  // CALLING ACTION HANDLERS
  // =========================================================================
  const handleStartCall = (type: 'video' | 'audio' = 'video') => {
    setCallStatus('calling');
    ringtoneRef.current.start(false); // Outgoing telephone chime

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'call_user',
          room: 'project_general',
          callerId: currentUser?.id,
          callerName: currentUser?.name,
          callerAvatar: currentUser?.avatarUrl,
          callType: type,
        })
      );
    }
  };

  const handleAcceptCall = () => {
    ringtoneRef.current.stop();
    setCallStatus('connected');
    setCurrentTab('chat');

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'call_accepted',
          room: 'project_general',
          callerId: incomingCallData?.callerId,
        })
      );
    }
  };

  const handleDeclineCall = () => {
    ringtoneRef.current.stop();
    setCallStatus('idle');

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'call_declined',
          room: 'project_general',
          callerId: incomingCallData?.callerId,
        })
      );
    }
    setIncomingCallData(null);
  };

  const handleEndCall = () => {
    ringtoneRef.current.stop();
    setCallStatus('idle');
    setIncomingCallData(null);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'call_ended',
          room: 'project_general',
        })
      );
    }
  };

  // =========================================================================
  // CHAT SEND MESSAGE
  // =========================================================================
  const handleSendMessage = async (text: string) => {
    if (!currentUser || !text.trim()) return;

    const newMsg: ChatMessageItem = {
      id: String(Date.now()),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isSelf: true,
    };

    setChatMessages((prev) => [...prev, newMsg]);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'chat_message',
          room: 'project_general',
          payload: {
            id: newMsg.id,
            senderId: currentUser.id,
            senderName: currentUser.name,
            text: newMsg.text,
            createdAt: newMsg.createdAt,
          },
        })
      );
    }

    try {
      await sendChatMessage(newMsg.text);
    } catch {}
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab(user.role === 'client' ? 'client_dashboard' : 'briefs');
    }
    triggerFloatingToast({
      type: 'info',
      title: 'Signed In',
      message: `Welcome back, ${user.name}!`,
      timestamp: 'Just now',
    });
  };

  const handleLogout = () => {
    ringtoneRef.current.stop();
    if (socketRef.current) {
      socketRef.current.close();
    }
    setCurrentUser(null);
    clearAuthSession();
  };

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Determine peer online status (if active in WebSocket)
  const peerOnline = isWsConnected;

  return (
    <FloxaWorkShell
      currentUser={currentUser}
      currentTab={currentTab}
      onChangeTab={(tab) => setCurrentTab(tab)}
      onLogout={handleLogout}
      onOpenNewAction={() => {
        if (isClient) {
          setIsPostBriefOpen(true);
        } else {
          setCurrentTab('briefs');
          triggerFloatingToast({
            type: 'info',
            title: 'Explore Opportunities',
            message: 'Select an open brief to submit your Mini-Discovery pitch.',
            timestamp: 'Just now',
            tab: 'briefs',
          });
        }
      }}
      searchQuery={searchQuery}
      onSearchChange={(q) => setSearchQuery(q)}
      unreadMessagesCount={unreadMessagesCount}
      notifications={notifications}
      unreadNotificationsCount={unreadNotificationsCount}
      isOnline={isWsConnected}
      onClearNotifications={() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadNotificationsCount(0);
      }}
      onSelectNotification={(notif) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
        );
        setUnreadNotificationsCount((c) => Math.max(0, c - 1));
        if (notif.tab) {
          setCurrentTab(notif.tab);
        }
      }}
    >
      {/* ========================================================
          GLOBAL FLOATING NOTIFICATION TOASTS CONTAINER
          ======================================================== */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {floatingToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_16px_40px_rgba(0,132,255,0.18),0_4px_16px_rgba(15,23,42,0.1)] flex items-start gap-3 transition-all transform animate-in slide-in-from-top-4 duration-200"
          >
            {/* Avatar / Icon */}
            <div className="relative shrink-0">
              {toast.senderAvatar ? (
                <img
                  src={toast.senderAvatar}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-[#0084ff]/30 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#0084ff]/10 text-[#0084ff] flex items-center justify-center font-bold text-xs border border-[#0084ff]/20">
                  {toast.type === 'call' ? <Phone size={16} /> : <Bell size={16} />}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#0084ff] rounded-full border-2 border-white" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {toast.title}
                </span>
                <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-1">
                  {toast.timestamp}
                </span>
              </div>

              <p className="text-[11.5px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                {toast.message}
              </p>

              {/* Action Link Button */}
              {toast.tab && (
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (toast.tab) setCurrentTab(toast.tab);
                      setFloatingToasts((prev) => prev.filter((t) => t.id !== toast.id));
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0084ff] text-white text-[10.5px] font-bold shadow-[0_2px_8px_rgba(0,132,255,0.3)] hover:bg-[#0070f3] transition-all"
                  >
                    <span>{toast.tab === 'chat' ? 'Reply / View Chat' : 'Open View'}</span>
                    <ArrowRight size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => setFloatingToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-700 p-1 shrink-0 -mr-1 -mt-1"
              aria-label="Dismiss toast"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* ========================================================
          GLOBAL INCOMING CALL RINGING MODAL (RINGS ANYWHERE ON SITE!)
          ======================================================== */}
      {callStatus === 'ringing' && incomingCallData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-950 border border-slate-800 p-6 text-center text-white space-y-5 shadow-[0_24px_80px_rgba(0,132,255,0.4)]">
            <div className="relative inline-block mx-auto">
              <span className="absolute inset-0 rounded-full bg-[#0084ff]/30 animate-ping" />
              <img
                src={incomingCallData.callerAvatar || peerAvatar}
                alt={incomingCallData.callerName}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#0084ff] shadow-xl relative z-10 mx-auto"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Incoming Video Call</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">{incomingCallData.callerName}</h3>
              <p className="text-xs text-slate-400">Direct WebRTC Screening Interview</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleDeclineCall}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                <PhoneOff size={14} />
                <span>Decline</span>
              </button>

              <button
                onClick={handleAcceptCall}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_4px_20px_rgba(16,185,129,0.45)] transition-all animate-bounce"
              >
                <Phone size={14} />
                <span>Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          GLOBAL OUTGOING CALL RINGING MODAL (CALLER WAITING)
          ======================================================== */}
      {callStatus === 'calling' && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-950 border border-slate-800 p-6 text-center text-white space-y-5 shadow-[0_24px_80px_rgba(0,132,255,0.4)]">
            <div className="relative inline-block mx-auto">
              <span className="absolute inset-0 rounded-full bg-[#0084ff]/30 animate-ping" />
              <img
                src={peerAvatar}
                alt={peerName}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#0084ff] shadow-xl relative z-10 mx-auto"
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#0084ff] flex items-center justify-center gap-1.5">
                <Video size={14} className="animate-pulse" />
                <span>Calling {peerName}...</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">Ringing</h3>
              <p className="text-xs text-slate-400">Waiting for {peerName} to answer...</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleEndCall}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs mx-auto shadow-lg transition-all"
              >
                <PhoneOff size={15} />
                <span>Cancel Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: CLIENT DASHBOARD */}
      {isClient && currentTab === 'client_dashboard' && (
        <ClientDashboard
          key={`client-dash-${refreshKey}`}
          onPostNewBrief={() => setIsPostBriefOpen(true)}
          onOpenCall={() => {
            setCurrentTab('chat');
            handleStartCall('video');
          }}
          onEscrowReleased={() => {
            triggerFloatingToast({
              type: 'milestone',
              title: 'Direct Milestone Paid',
              message: 'Milestone approved and direct payment transferred to talent.',
              timestamp: 'Just now',
              tab: 'workspace',
            });
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* VIEW: ADVANCED DISCOVERY & INTELLIGENT MATCHING */}
      {currentTab === 'discovery' && (
        <DiscoveryView
          onOpenPitchModal={(brief) => setSelectedBriefForPitch(brief)}
          onOpenCall={() => {
            setCurrentTab('chat');
            handleStartCall('video');
          }}
        />
      )}

      {/* VIEW 2: EXPLORE BRIEFS */}
      {currentTab === 'briefs' && (
        <BriefsView
          key={`briefs-${refreshKey}`}
          onOpenPitch={(brief) => setSelectedBriefForPitch(brief)}
          onPostNewBrief={() => setIsPostBriefOpen(true)}
          searchFilter={searchQuery}
        />
      )}

      {/* VIEW 3: PROOF FEED */}
      {currentTab === 'feed' && (
        <FeedView
          key={`feed-${refreshKey}`}
          onDirectPitch={(authorName) => {
            triggerFloatingToast({
              type: 'info',
              title: 'Direct Consultation',
              message: `Opening direct messaging with ${authorName}`,
              timestamp: 'Just now',
              tab: 'chat',
            });
            setCurrentTab('chat');
          }}
        />
      )}

      {/* VIEW 4: PROPOSALS (Dynamic from Database) */}
      {currentTab === 'mini-discovery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">
              {isClient ? 'Incoming Proposals' : 'My Submitted Proposals'}
            </h2>
            <span className="text-xs text-slate-500 font-mono font-medium">
              {myProposals.length} Total
            </span>
          </div>

          {isLoadingProposals ? (
            <div className="floxa-card py-16 text-center text-slate-500">
              <div className="inline-block animate-spin w-6 h-6 border-2 border-[#0084ff] border-t-transparent rounded-full mb-3" />
              <div className="text-xs font-medium">Loading proposals from database...</div>
            </div>
          ) : myProposals.length === 0 ? (
            <div className="floxa-card py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0084ff]/10 border border-[#0084ff]/25 flex items-center justify-center mx-auto text-[#0084ff]">
                <Inbox size={26} />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">No Proposals Found</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  {isClient
                    ? 'You have not received any discovery proposals on your briefs yet.'
                    : 'You have not submitted any Mini-Discovery pitches yet. Go to Explore Briefs to find live opportunities!'}
                </p>
              </div>
              {!isClient && (
                <div>
                  <button
                    onClick={() => setCurrentTab('briefs')}
                    className="btn-cyan-pill text-xs px-5 py-2.5"
                  >
                    <span>Browse Open Briefs</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            myProposals.map((prop) => {
              const brief = prop.briefId || {};
              const freelancer = prop.freelancerId || {};
              const diagnosis = prop.diagnosticAnswers?.[0]?.answer || 'Detailed problem diagnosis submitted.';

              return (
                <div key={prop._id || prop.id} className="floxa-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#0084ff] uppercase tracking-wider">
                        {prop.status === 'accepted' ? 'Accepted & Advance Paid' : 'Under Review'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                        {brief.title || 'Client Brief'}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium">
                        {isClient
                          ? `Applicant: ${freelancer.name || 'Talent'} (@${freelancer.handle || 'talent'})`
                          : `Budget: $${brief.budgetMin?.toLocaleString()} - $${brief.budgetMax?.toLocaleString()}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-[#0084ff]">
                        ${prop.totalPrice?.toLocaleString()} Proposed
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {prop.proposedMilestones?.length || 3} Direct Milestones
                      </div>
                    </div>
                  </div>

                  <p className="p-3.5 rounded-xl bg-white/80 border border-slate-200 text-xs text-slate-700 leading-relaxed shadow-sm">
                    {diagnosis}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-medium">
                    <span className="text-slate-500">
                      Status: {prop.status === 'accepted' ? 'Milestone 1 Advance Transferred' : 'Client reviewing proposal'}
                    </span>
                    <button
                      onClick={() => setCurrentTab('workspace')}
                      className="text-[#0084ff] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>View Milestone Roadmap</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 5: ACTIVE CONTRACT WORKSPACE */}
      {currentTab === 'workspace' && <WorkspaceView />}

      {/* VIEW 6: LIVE CHAT & WEBRTC CALLING */}
      {currentTab === 'chat' && (
        <ChatView
          currentUser={currentUser}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isConnected={isWsConnected}
          peerOnline={peerOnline}
          callStatus={callStatus}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          onAcceptCall={handleAcceptCall}
          onDeclineCall={handleDeclineCall}
          incomingCallData={incomingCallData}
        />
      )}

      {/* VIEW 7: ESCROW / PAYMENT LEDGER (REAL DATABASE DRIVEN) */}
      {currentTab === 'escrow' && <PaymentLedgerView />}

      {/* VIEW 8: MEMBER PROFILE (LIVE EDITING & PERSISTENCE) */}
      {currentTab === 'profile' && (
        <ProfileView
          currentUser={currentUser}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            triggerFloatingToast({
              type: 'info',
              title: 'Profile Updated',
              message: 'Your profile changes have been saved to database.',
              timestamp: 'Just now',
            });
          }}
          onLogout={handleLogout}
        />
      )}

      {/* VIEW 9: OPERATIONS & KYC ADMIN PORTAL (ADMIN ONLY) */}
      {currentTab === 'admin' && (
        isAdmin ? (
          <AdminPortal />
        ) : (
          <div className="p-8 max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Access Restricted</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              The Operations &amp; Governance Center is restricted to platform administrators. Your account does not have administrative privileges.
            </p>
            <button
              onClick={() => setCurrentTab(isClient ? 'client_dashboard' : 'briefs')}
              className="px-4 py-2 rounded-xl bg-[#0084ff] hover:bg-[#0070e0] text-white text-xs font-semibold cursor-pointer transition-all"
            >
              Return to Workspace
            </button>
          </div>
        )
      )}

      {/* Modal: Mini-Discovery Proposal Bidding */}
      <MiniDiscoveryModal
        brief={selectedBriefForPitch}
        onClose={() => setSelectedBriefForPitch(null)}
        onSubmitSuccess={() => {
          setSelectedBriefForPitch(null);
          triggerFloatingToast({
            type: 'proposal',
            title: 'Mini-Discovery Pitch Submitted',
            message: 'Your structured proposal and milestone plan was submitted directly to the client.',
            timestamp: 'Just now',
            tab: 'mini-discovery',
          });
          setRefreshKey((k) => k + 1);
          setCurrentTab('mini-discovery');
        }}
      />

      {/* Modal: Client Post Guided Brief */}
      {isPostBriefOpen && (
        <PostBriefModal
          onClose={() => setIsPostBriefOpen(false)}
          onPostSuccess={() => {
            setIsPostBriefOpen(false);
            triggerFloatingToast({
              type: 'info',
              title: 'Brief Published',
              message: 'Your brief has been published live to the FLOXA Work marketplace.',
              timestamp: 'Just now',
              tab: 'briefs',
            });
            setRefreshKey((k) => k + 1);
            setCurrentTab('briefs');
          }}
        />
      )}
    </FloxaWorkShell>
  );
}
