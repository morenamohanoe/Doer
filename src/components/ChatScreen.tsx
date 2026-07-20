/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Camera,
  ArrowLeft,
  ShieldCheck,
  CheckCheck,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
  MessageSquareOff,
  Trash2
} from 'lucide-react';
import { Conversation } from '../types';

export default function ChatScreen() {
  const {
    conversations,
    messages,
    sendMessage,
    setTypingStatus,
    markMessagesAsRead,
    currentUser,
    triggerSound,
    deleteConversation
  } = useApp();

  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyTyping = useRef(false);

  // Mark messages as read when active conversation changes or new messages arrive
  useEffect(() => {
    if (activeConvId) {
      markMessagesAsRead(activeConvId);
    }
  }, [activeConvId, messages, markMessagesAsRead]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (activeConvId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeConvId]);

  // Clear typing status when active conversation changes or component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (activeConvId && isCurrentlyTyping.current) {
        setTypingStatus(activeConvId, false);
        isCurrentlyTyping.current = false;
      }
    };
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activeMessages = messages.filter((m) => m.conversationId === activeConvId && !m.typing).reverse();
  const otherUserTyping = messages.some(
    (m) => m.conversationId === activeConvId && m.senderId !== currentUser.id && m.typing === true
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!activeConvId) return;

    if (val.trim().length > 0) {
      if (!isCurrentlyTyping.current) {
        isCurrentlyTyping.current = true;
        setTypingStatus(activeConvId, true);
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isCurrentlyTyping.current = false;
        setTypingStatus(activeConvId, false);
      }, 3000);
    } else {
      if (isCurrentlyTyping.current) {
        isCurrentlyTyping.current = false;
        setTypingStatus(activeConvId, false);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isCurrentlyTyping.current && activeConvId) {
      isCurrentlyTyping.current = false;
      setTypingStatus(activeConvId, false);
    }

    triggerSound('click');
    sendMessage(activeConvId!, inputText, selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
  };

  const attachMockImage = () => {
    triggerSound('success');
    const pics = [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=80'
    ];
    const randomPic = pics[Math.floor(Math.random() * pics.length)];
    setSelectedImage(randomPic);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-16 text-left">
      <AnimatePresence mode="wait">
        
        {/* --- INBOX CONVERSATION LISTS --- */}
        {!activeConvId ? (
          <motion.div
            key="inbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            {/* Header */}
            <div className="bg-zinc-900 text-white px-6 py-6 rounded-b-[32px] shadow-lg">
              <h2 className="text-xl font-black">Messages Inbox</h2>
              <p className="text-xs text-brand font-semibold">Live negotiations with your service providers</p>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-72 text-center">
                  <MessageSquareOff className="w-10 h-10 text-slate-300 mb-3" />
                  <h3 className="text-sm font-extrabold text-slate-700">Inbox is empty</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-xs mt-1">
                    Negotiate prices and confirm job details after hiring a DOER. Book a service to get started.
                  </p>
                </div>
              ) : (
                conversations.map((c) => {
                  const lastMsg = messages.filter((m) => m.conversationId === c.id).reverse().pop();
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        triggerSound('click');
                        setActiveConvId(c.id);
                      }}
                      className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-slate-200 shadow-xs flex items-center justify-between cursor-pointer text-left transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={c.doerId === currentUser.id ? c.bookingOwnerAvatar : c.doerAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&fit=crop&q=80'}
                          alt={c.doerId === currentUser.id ? c.bookingOwnerName : c.doerName}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200 flex-shrink-0"
                          onError={(e) => {
                            const name = c.doerId === currentUser.id ? c.bookingOwnerName : c.doerName;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                          }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {c.doerId === currentUser.id ? c.bookingOwnerName : c.doerName}
                          </h4>
                          <p className="text-xs text-slate-400 font-semibold line-clamp-1 mt-0.5">
                            {lastMsg ? lastMsg.text : c.lastMessageText}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-4 flex flex-col items-end gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">{c.lastMessageTime}</span>
                        <div className="flex items-center gap-2">
                          {c.unreadCount > 0 && (
                            <span className="bg-brand text-white font-extrabold text-[10px] h-4.5 w-4.5 rounded-full flex items-center justify-center">
                              {c.unreadCount}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerSound('alert');
                              setIsDeleting(c.id);
                            }}
                            className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                            title="Delete Conversation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          
          /* --- ACTIVE CHAT CHANNEL --- */
          <motion.div
            key="chat"
            initial={{ x: 350 }}
            animate={{ x: 0 }}
            exit={{ x: 350 }}
            className="flex-1 flex flex-col h-full absolute inset-0 z-10 bg-slate-50"
          >
            {/* Active Header */}
            <div className="bg-zinc-900 text-white px-5 py-4 flex items-center gap-3 shadow-md">
              <button
                onClick={() => {
                  triggerSound('click');
                  setActiveConvId(null);
                }}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <img
                src={activeConv?.doerId === currentUser.id ? activeConv?.bookingOwnerAvatar : activeConv?.doerAvatar}
                alt={activeConv?.doerId === currentUser.id ? activeConv?.bookingOwnerName : activeConv?.doerName}
                className="w-9 h-9 rounded-full object-cover border border-white/20"
                onError={(e) => {
                  const name = activeConv?.doerId === currentUser.id ? activeConv?.bookingOwnerName : activeConv?.doerName;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
                }}
              />
              <div>
                <h3 className="font-extrabold text-sm leading-tight">
                  {activeConv?.doerId === currentUser.id ? activeConv?.bookingOwnerName : activeConv?.doerName}
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  ● Connected
                </span>
              </div>
            </div>

            {/* Core Message Feed */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 pb-20">
              
              {/* Escrow banner inside chat */}
              <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-brand flex-shrink-0" />
                <span className="text-[10px] text-slate-500 font-bold leading-normal">
                  DOER Escrow operates safely under South African mercantile laws. 50% deposit must stay in escrow to secure contracts.
                </span>
              </div>

              {activeMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const isSystem = msg.senderId === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="mx-auto max-w-[85%] text-center py-2.5">
                      <span className="bg-brand-light border border-brand/20 text-brand-dark px-3.5 py-2 rounded-2xl text-[10px] font-bold leading-normal inline-block shadow-inner">
                        🔒 {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3.5 space-y-1.5 shadow-xs ${
                      isMe ? 'bg-brand text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-900 rounded-bl-none'
                    }`}>
                      <span className={`text-[9px] font-bold uppercase block ${isMe ? 'text-brand-light' : 'text-slate-400'}`}>
                        {msg.senderName}
                      </span>
                      {msg.text && (
                        <p className="text-xs font-semibold leading-relaxed whitespace-pre-line">{msg.text}</p>
                      )}
                      {msg.imageUrl && (
                        <div className="rounded-xl overflow-hidden max-h-48 border border-slate-100">
                          <img src={msg.imageUrl} alt="Attached asset" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-1 pt-0.5">
                        <span className={`text-[8px] font-bold ${isMe ? 'text-brand-light font-medium' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && (
                          <CheckCheck 
                            className={`w-3.5 h-3.5 ${msg.read ? 'text-sky-300' : 'text-white/40'}`} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {otherUserTyping && (
                <div className="flex justify-start items-center gap-2 py-1">
                  <div className="flex items-center space-x-1.5 bg-slate-100/70 border border-slate-100 py-2.5 px-4 rounded-2xl rounded-bl-none shadow-xs text-slate-500">
                    <span className="text-[10px] font-bold text-slate-500">
                      {activeConv?.doerId === currentUser.id ? activeConv?.bookingOwnerName : activeConv?.doerName} is typing
                    </span>
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Float Send Input Box */}
            <form
              onSubmit={handleSend}
              className="absolute bottom-16 left-0 right-0 p-3 bg-white border-t border-slate-100 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={attachMockImage}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-all"
                title="Attach Picture"
              >
                <Camera className="w-5 h-5" />
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={selectedImage ? 'Image selected! Press Send...' : 'Type message here...'}
                  value={inputText}
                  onChange={handleInputChange}
                  disabled={!!selectedImage}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand"
                />
                {selectedImage && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    <span>Attached</span>
                    <button onClick={() => setSelectedImage(null)} className="text-rose-500 font-bold">✕</button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="p-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl transition-all shadow-md active:scale-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      <AnimatePresence>
        {isDeleting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Delete Chat?</h3>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed mb-8">
                  This will permanently remove your conversation history with this DOER. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleting(null)}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      deleteConversation(isDeleting);
                      setIsDeleting(null);
                    }}
                    className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-200 transition-all active:scale-[0.98]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
