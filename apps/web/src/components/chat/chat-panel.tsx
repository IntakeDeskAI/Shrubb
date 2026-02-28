'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  intent?: string;
}

interface ChatPanelProps {
  projectId: string;
  initialMessages: Message[];
}

export function ChatPanel({ projectId, initialMessages }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const lastMessage = messages[messages.length - 1];
      const after = lastMessage?.created_at ?? new Date(0).toISOString();

      try {
        const res = await fetch(
          `/api/chat/messages?project_id=${projectId}&after=${encodeURIComponent(after)}`
        );
        if (!res.ok) return;
        const newMessages: Message[] = await res.json();

        if (newMessages.length > 0) {
          setMessages((prev) => {
            // Merge, deduplicating by id
            const existingIds = new Set(prev.map((m) => m.id));
            const unique = newMessages.filter((m) => !existingIds.has(m.id));
            if (unique.length === 0) return prev;
            return [...prev, ...unique];
          });

          // If we got an assistant message, we're no longer waiting
          if (newMessages.some((m) => m.role === 'assistant')) {
            setWaitingForReply(false);
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [projectId, messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [input]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setError(null);
    setSending(true);

    // Optimistically add user message
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput('');
    setWaitingForReply(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMessage =
          data.error ?? `Failed to send message (${res.status})`;
        setError(errorMessage);
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticMessage.id)
        );
        setInput(content);
        setWaitingForReply(false);
        return;
      }

      const data = await res.json();

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMessage.id
            ? { ...m, id: data.message_id }
            : m
        )
      );
    } catch {
      setError('Network error. Please try again.');
      setMessages((prev) =>
        prev.filter((m) => m.id !== optimisticMessage.id)
      );
      setInput(content);
      setWaitingForReply(false);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                <svg
                  className="h-6 w-6 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Start a conversation about your yard design.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
                <p
                  className={`mt-1.5 text-xs ${
                    message.role === 'user'
                      ? 'text-brand-100'
                      : 'text-gray-400'
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {waitingForReply && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-gray-100 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-t border-red-100 bg-red-50 px-6 py-2">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your yard ideas..."
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
