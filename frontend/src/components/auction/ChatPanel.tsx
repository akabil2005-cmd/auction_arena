'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types';
import { formatTime } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  roomCode: string;
}

export default function ChatPanel({
  messages,
  onSendMessage,
  roomCode,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { emit } = useSocket();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleEmojiClick = (emoji: string) => {
    (emit as any)('emoji-reaction', { emoji });
  };

  const reactionEmojis = ['🔥', '💸', '😂', '😮', '🔨', '👑'];

  return (
    <div className="flex flex-col h-[320px] bg-white/[0.01] border border-white/[0.05] rounded-3xl p-5">
      <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-orbitron mb-3">
        Arena Chat & Banter
      </h3>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scroll-smooth text-xs">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 font-semibold uppercase tracking-wider font-orbitron text-[10px]">
            Send a message to start banter...
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.playerId === 'system' || msg.type === 'system';

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="bg-white/[0.02] border border-white/[0.04] p-2 rounded-xl text-center text-gray-400 font-semibold tracking-wide"
                >
                  {msg.message}
                </div>
              );
            }

            return (
              <div key={msg.id} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-purple-400">
                    {msg.playerName}
                  </span>
                  <span className="text-[8px] font-semibold text-gray-500 font-orbitron">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-gray-300 font-semibold pl-1.5 border-l border-white/10 break-words">
                  {msg.message}
                </p>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Emoji Reactions Toolbar */}
      <div className="flex items-center justify-between border-t border-white/[0.05] pt-3.5 mt-3.5">
        <div className="flex items-center gap-2">
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="text-base hover:scale-125 transition-transform duration-200"
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="Send banter..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-[#12121e] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-500 font-semibold outline-none focus:border-purple-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-2 font-bold font-orbitron text-xs tracking-wider uppercase transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
