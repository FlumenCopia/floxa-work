'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Video,
  Phone,
  CheckCircle2,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Sparkles,
  PhoneForwarded,
  Paperclip,
  FileText,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Maximize2,
  X,
} from 'lucide-react';
import { uploadFile } from '@/lib/api';
import { AuthUser } from './auth/AuthScreen';

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isSelf: boolean;
}

interface ChatViewProps {
  currentUser: AuthUser;
  messages: ChatMessageItem[];
  onSendMessage: (text: string) => Promise<void> | void;
  isConnected: boolean;
  peerOnline: boolean;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected' | 'declined';
  onStartCall: (type?: 'video' | 'audio') => void;
  onEndCall: () => void;
  onAcceptCall: () => void;
  onDeclineCall: () => void;
  incomingCallData: {
    callerId: string;
    callerName: string;
    callerAvatar?: string;
  } | null;
}

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif|svg|bmp)(\?.*)?$/i;

interface ParsedMessageSegment {
  type: 'text' | 'image' | 'file';
  text?: string;
  url?: string;
  name?: string;
}

function parseMessageSegments(content: string): ParsedMessageSegment[] {
  if (!content) return [];
  const segments: ParsedMessageSegment[] = [];

  // Match: ![alt](url) or [File: name](url) or [name](url)
  const pattern = /(!?\[(?:File:\s*)?([^\]]+)\]\((https?:\/\/[^\s\)]+|\/[^\s\)]+)\))/gi;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    const fullMatch = match[0];
    const isExclamation = fullMatch.startsWith('!');
    const name = match[2].trim();
    let url = match[3].trim();
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      const textPart = content.substring(lastIndex, matchIndex);
      if (textPart.trim()) {
        segments.push({ type: 'text', text: textPart });
      }
    }

    // Determine if it's an image
    const isImage =
      isExclamation ||
      IMAGE_EXTENSIONS.test(name) ||
      IMAGE_EXTENSIONS.test(url.split('?')[0]);

    if (isImage) {
      let previewUrl = url;
      // Convert /download to /view for inline image stream if needed
      if (previewUrl.includes('/download')) {
        previewUrl = previewUrl.replace(/\/download(\?.*)?$/, '/view$1');
      }
      segments.push({
        type: 'image',
        name,
        url: previewUrl,
      });
    } else {
      segments.push({
        type: 'file',
        name,
        url,
      });
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    if (remainingText.trim()) {
      segments.push({ type: 'text', text: remainingText });
    }
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', text: content });
  }

  return segments;
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  messages,
  onSendMessage,
  isConnected,
  peerOnline,
  callStatus,
  onStartCall,
  onEndCall,
  onAcceptCall,
  onDeclineCall,
  incomingCallData,
}) => {
  const [inputText, setInputText] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isClient = currentUser.role === 'client';
  const peerName = isClient ? 'Aravind V.' : 'Sanjay Mehta';
  const peerHandle = isClient ? 'aravind_design' : 'sanjay_medx';
  const peerRole = isClient ? 'Lead Brand Architect' : 'Managing Director';
  const peerAvatar = isClient
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80';

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isUploadingChatFile, setIsUploadingChatFile] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingChatFile(true);
    try {
      const res = await uploadFile(file, 'attachment', true);
      const isImg = file.type.startsWith('image/') || IMAGE_EXTENSIONS.test(file.name);
      const viewUrl = res.accessUrl || res.downloadUrl;
      const fileLink = isImg
        ? `![${file.name}](${viewUrl})`
        : `[File: ${file.name}](${res.downloadUrl || viewUrl})`;
      await onSendMessage(fileLink);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setIsUploadingChatFile(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle camera start/stop when call connects/disconnects
  useEffect(() => {
    if (callStatus === 'connected') {
      startCamera();
    } else {
      stopCamera();
      setCallDuration(0);
    }
    return () => {
      stopCamera();
    };
  }, [callStatus]);

  // Call duration timer
  useEffect(() => {
    let interval: any;
    if (callStatus === 'connected') {
      interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch {
      // Graceful fallback if camera blocked or in headless browser
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    onSendMessage(text);
  };

  const quickPrompts = [
    "Let's review the diagnostic answers for Milestone 1.",
    "Can we schedule a 10-minute video interview?",
    "I have uploaded the design tokens and logo kit.",
  ];

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[78vh] sm:h-[82vh] floxa-card p-0 overflow-hidden relative border border-slate-200/90 shadow-[0_16px_50px_rgba(0,132,255,0.08)]">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white/90 border-b border-slate-200/90 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={peerAvatar}
              alt={peerName}
              className="w-10 h-10 rounded-full object-cover border border-[#0084ff]/30 shadow-sm"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                peerOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]' : 'bg-slate-300'
              }`}
              title={peerOnline ? 'Online now' : 'Offline'}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm truncate">{peerName}</span>
              <CheckCircle2 size={13} className="text-[#0084ff] shrink-0" />
            </div>
            <div className="text-[11px] text-slate-500 truncate font-medium flex items-center gap-1.5">
              <span>@{peerHandle} • {peerRole}</span>
              {peerOnline && (
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Online
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Socket Status & Screening Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}
            />
            <span>{isConnected ? 'Socket Connected' : 'Connecting'}</span>
          </div>

          <button
            onClick={() => onStartCall('video')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0084ff] text-white text-xs font-bold shadow-[0_2px_10px_rgba(0,132,255,0.35)] hover:bg-[#0070f3] transition-all"
            title="Start WebRTC Video Interview"
          >
            <Video size={14} />
            <span className="hidden sm:inline">Video Call</span>
          </button>

          <button
            onClick={() => onStartCall('audio')}
            className="p-2 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-sm"
            title="Start Voice Call"
          >
            <Phone size={14} />
          </button>
        </div>
      </div>

      {/* 2. Messages Bubble List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50/60 to-white/70">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[70%]">
              {!msg.isSelf && (
                <img
                  src={peerAvatar}
                  alt={msg.senderName}
                  className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 border border-slate-200"
                />
              )}

              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.isSelf
                    ? 'bg-[#0084ff] text-white rounded-br-sm shadow-[0_4px_16px_rgba(0,132,255,0.25)]'
                    : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200/90 shadow-sm'
                }`}
              >
                {(() => {
                  const segments = parseMessageSegments(msg.text);
                  return (
                    <div className="space-y-2">
                      {segments.map((seg, idx) => {
                        if (seg.type === 'image') {
                          return (
                            <div
                              key={idx}
                              className="rounded-xl overflow-hidden border border-black/10 bg-black/5 shadow-sm max-w-[280px] sm:max-w-[340px]"
                            >
                              <div
                                onClick={() =>
                                  setLightboxImage({
                                    url: seg.url!,
                                    name: seg.name || 'Image attachment',
                                  })
                                }
                                className="relative group cursor-pointer overflow-hidden bg-slate-900/10 flex items-center justify-center min-h-[140px] max-h-72"
                              >
                                <img
                                  src={seg.url}
                                  alt={seg.name || 'Chat attachment'}
                                  className="w-full h-auto max-h-72 object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <span className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg">
                                    <Maximize2 size={12} />
                                    <span>Enlarge</span>
                                  </span>
                                </div>
                              </div>

                              <div
                                className={`px-2.5 py-1.5 flex items-center justify-between text-[11px] font-medium gap-2 ${
                                  msg.isSelf
                                    ? 'bg-black/15 text-white/90'
                                    : 'bg-slate-50 text-slate-700 border-t border-slate-100'
                                }`}
                              >
                                <span className="truncate flex items-center gap-1.5 min-w-0">
                                  <ImageIcon size={13} className="shrink-0 opacity-80" />
                                  <span className="truncate">{seg.name || 'Image.png'}</span>
                                </span>
                                <a
                                  href={seg.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={seg.name}
                                  className={`p-1 rounded shrink-0 transition-colors ${
                                    msg.isSelf
                                      ? 'hover:bg-white/20 text-white'
                                      : 'hover:bg-slate-200 text-slate-600'
                                  }`}
                                  title="Download Image"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download size={13} />
                                </a>
                              </div>
                            </div>
                          );
                        }

                        if (seg.type === 'file') {
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 p-2.5 px-3 rounded-xl border max-w-sm ${
                                msg.isSelf
                                  ? 'bg-white/15 border-white/25 text-white'
                                  : 'bg-slate-50 border-slate-200/90 text-slate-800 shadow-sm'
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg shrink-0 ${
                                  msg.isSelf
                                    ? 'bg-white/20 text-white'
                                    : 'bg-[#0084ff]/10 text-[#0084ff]'
                                }`}
                              >
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold truncate leading-tight">
                                  {seg.name || 'Attached File'}
                                </div>
                                <div
                                  className={`text-[10px] mt-0.5 ${
                                    msg.isSelf ? 'text-white/80' : 'text-slate-400'
                                  }`}
                                >
                                  File attachment
                                </div>
                              </div>
                              <a
                                href={seg.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={seg.name}
                                className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                                  msg.isSelf
                                    ? 'hover:bg-white/20 text-white'
                                    : 'hover:bg-slate-200 text-slate-600'
                                }`}
                                title="Download File"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="whitespace-pre-wrap break-words">
                            {seg.text}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Quick Suggestions Row */}
      <div className="px-4 py-2 bg-white/95 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <Sparkles size={13} className="text-[#0084ff] shrink-0" />
        {quickPrompts.map((q) => (
          <button
            key={q}
            onClick={() => setInputText(q)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors font-medium shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* 4. Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 bg-white/95 border-t border-slate-200/90 flex items-center gap-2"
      >
        <label
          className="p-2.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
          title="Attach file or deliverable"
        >
          <Paperclip size={15} className={isUploadingChatFile ? 'animate-spin text-[#0084ff]' : ''} />
          <input
            type="file"
            className="hidden"
            onChange={handleChatFileUpload}
            disabled={isUploadingChatFile}
          />
        </label>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${peerName}... (Enter to send)`}
          className="flex-1 text-xs sm:text-sm px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 focus:border-[#0084ff] focus:bg-white outline-none text-slate-900 shadow-inner"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn-cyan-pill px-4 py-2.5 text-xs font-bold disabled:opacity-40"
        >
          <span>Send</span>
          <Send size={13} />
        </button>
      </form>

      {/* ========================================================
          5. INCOMING CALL MODAL (FALLBACK INSIDE CHATVIEW)
          ======================================================== */}
      {callStatus === 'ringing' && incomingCallData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-950 border border-slate-800 p-6 text-center text-white space-y-5 shadow-[0_24px_80px_rgba(0,132,255,0.35)]">
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
                onClick={onDeclineCall}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                <PhoneOff size={14} />
                <span>Decline</span>
              </button>

              <button
                onClick={onAcceptCall}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-[0_4px_20px_rgba(16,185,129,0.4)] transition-all animate-bounce"
              >
                <Phone size={14} />
                <span>Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. OUTGOING CALL / RINGING MODAL (CALLER)
          ======================================================== */}
      {callStatus === 'calling' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-950 border border-slate-800 p-6 text-center text-white space-y-5 shadow-[0_24px_80px_rgba(0,132,255,0.35)]">
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
                <PhoneForwarded size={14} className="animate-pulse" />
                <span>Calling {peerName}...</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">Ringing</h3>
              <p className="text-xs text-slate-400">Waiting for {peerName} to answer...</p>
            </div>

            <div className="pt-2">
              <button
                onClick={onEndCall}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs mx-auto shadow-lg transition-all"
              >
                <PhoneOff size={15} />
                <span>Cancel Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          7. CALL DECLINED NOTICE
          ======================================================== */}
      {callStatus === 'declined' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="p-6 rounded-2xl bg-slate-950 border border-red-500/50 text-center text-white space-y-2">
            <PhoneOff size={28} className="text-red-400 mx-auto" />
            <h4 className="text-sm font-bold">Call Declined</h4>
            <p className="text-xs text-slate-400">{peerName} is currently unavailable.</p>
          </div>
        </div>
      )}

      {/* ========================================================
          8. CONNECTED WebRTC VIDEO INTERVIEW ROOM
          ======================================================== */}
      {callStatus === 'connected' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-6 text-white space-y-4 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
            {/* Call Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  WebRTC Live Screening Call Connected
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-300">
                {formatTimer(callDuration)}
              </div>
            </div>

            {/* Video Canvas Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 aspect-[16/10] sm:aspect-[16/9]">
              {/* Remote Peer Video Stream */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <img
                  src={peerAvatar}
                  alt={peerName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#0084ff] shadow-lg animate-pulse"
                />
                <div className="absolute bottom-2 left-2 text-[11px] font-semibold bg-black/60 px-2 py-0.5 rounded-md text-white backdrop-blur-sm">
                  {peerName} ({peerRole})
                </div>
              </div>

              {/* Local Video Stream with Camera Support */}
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                {isVideoMuted ? (
                  <div className="text-center text-slate-500 text-xs">
                    <VideoOff size={28} className="mx-auto mb-1 text-slate-600" />
                    <span>Camera is turned off</span>
                  </div>
                ) : (
                  <>
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {!streamRef.current && (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-20 h-20 rounded-full object-cover border border-white/20 shadow-md"
                      />
                    )}
                  </>
                )}
                <div className="absolute bottom-2 left-2 text-[11px] font-semibold bg-black/60 px-2 py-0.5 rounded-md text-white backdrop-blur-sm">
                  You ({currentUser.name})
                </div>
              </div>
            </div>

            {/* Call Controls Bar */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setIsMicMuted(!isMicMuted)}
                className={`p-3 rounded-full border transition-all ${
                  isMicMuted
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                }`}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-3 rounded-full border transition-all ${
                  isVideoMuted
                    ? 'bg-red-500/20 border-red-500 text-red-400'
                    : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                }`}
                title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoMuted ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              <button
                onClick={onEndCall}
                className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-[0_4px_18px_rgba(220,38,38,0.4)]"
              >
                <PhoneOff size={15} />
                <span>End Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Lightbox Modal for Full-Screen Image Viewing */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col cursor-default animate-in zoom-in-95 duration-150"
          >
            {/* Header bar */}
            <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between text-white">
              <span className="text-xs font-semibold truncate max-w-md flex items-center gap-2">
                <ImageIcon size={14} className="text-[#0084ff]" />
                <span className="truncate">{lightboxImage.name}</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  download={lightboxImage.name}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="Download Image"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {/* Image body */}
            <div className="p-3 sm:p-6 flex items-center justify-center overflow-auto max-h-[calc(92vh-56px)] bg-black/40">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
