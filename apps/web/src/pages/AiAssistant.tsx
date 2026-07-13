import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useToastStore } from '../store/toast-store';
import { apiClient } from '../api/client';
import { AiConversation, AiMessage } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import {
  Bot,
  Send,
  Plus,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

// ─── Suggested Prompts ────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'How can I allocate my surplus balance?',
  'Can you list my active goals and progress?',
  'Should I create a SIP for my Emergency Fund?',
  'Analyze my current connected account balance.',
];

// ─── Markdown Renderer ────────────────────────────────────────────────────────

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const codeLines = part.slice(3, -3).trim().split('\n');
      const language = codeLines[0].match(/^[a-zA-Z0-9_-]+$/) ? codeLines[0] : '';
      const code = language ? codeLines.slice(1).join('\n') : codeLines.join('\n');
      return (
        <pre
          key={index}
          className="my-2.5 p-3 bg-bg-base border border-border-light rounded-sq-sm overflow-x-auto text-[11px] font-mono text-text-primary whitespace-pre-wrap break-all"
        >
          {language && (
            <div className="text-[9px] text-text-muted uppercase font-bold tracking-wider mb-1.5">
              {language}
            </div>
          )}
          <code>{code}</code>
        </pre>
      );
    }

    const lines = part.split('\n');
    return (
      <div key={index} className="flex flex-col gap-1.5">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={lIdx} className="h-2" />;
          }

          // Bullet points
          const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
          const displayLine = isBullet ? trimmed.substring(2) : line;

          // Parse bold (e.g. **text**)
          const boldParts = displayLine.split(/(\*\*.*?\*\*)/g);
          const parsedLine = boldParts.map((bp, bpIdx) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return (
                <strong key={bpIdx} className="font-bold text-text-primary">
                  {bp.slice(2, -2)}
                </strong>
              );
            }
            // Parse inline code (e.g. `code`)
            const codeParts = bp.split(/(`.*?`)/g);
            return codeParts.map((cp, cpIdx) => {
              if (cp.startsWith('`') && cp.endsWith('`')) {
                return (
                  <code
                    key={cpIdx}
                    className="px-1.5 py-0.5 bg-bg-base border border-border-light text-[11px] font-mono rounded text-brand-secondary font-semibold"
                  >
                    {cp.slice(1, -1)}
                  </code>
                );
              }
              return cp;
            });
          });

          if (isBullet) {
            return (
              <ul key={lIdx} className="list-disc pl-4 text-xs text-text-secondary my-0.5">
                <li>{parsedLine}</li>
              </ul>
            );
          }

          if (trimmed.startsWith('### ')) {
            return (
              <h4
                key={lIdx}
                className="text-xs font-bold text-text-primary mt-2 uppercase tracking-wider"
              >
                {trimmed.substring(4)}
              </h4>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={lIdx} className="text-sm font-bold text-text-primary mt-2.5">
                {trimmed.substring(3)}
              </h3>
            );
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={lIdx} className="text-base font-extrabold text-text-primary mt-3">
                {trimmed.substring(2)}
              </h2>
            );
          }

          return (
            <p key={lIdx} className="text-xs text-text-secondary leading-relaxed">
              {parsedLine}
            </p>
          );
        })}
      </div>
    );
  });
};

// ─── Copy Button Sub-component ────────────────────────────────────────────────

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-bg-base text-text-muted hover:text-text-primary transition-all shrink-0 self-start"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-brand-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

// Helper to generate temporary message ID outside the component scope to ensure render purity
const generateTempId = () => `temp-${Date.now()}`;

// ─── Main Component ───────────────────────────────────────────────────────────

export const AiAssistant: React.FC = () => {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToastStore();

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch threads list
  const fetchConversations = useCallback(
    async (selectFirst = false) => {
      setIsLoadingList(true);
      try {
        const res = await apiClient.get('/ai/conversations');
        const list = res.data.data;
        setConversations(list);
        if (selectFirst && list.length > 0 && !activeConvId) {
          setActiveConvId(list[0].id);
        }
      } catch {
        // Non-critical loading failure handled gracefully
      } finally {
        setIsLoadingList(false);
      }
    },
    [activeConvId],
  );

  // Fetch history for active thread
  const fetchHistory = useCallback(
    async (id: string) => {
      setIsLoadingHistory(true);
      try {
        const res = await apiClient.get(`/ai/conversations/${id}/history`);
        setMessages(res.data.data);
        setTimeout(scrollToBottom, 50);
      } catch {
        addToast('error', 'History Failed', 'Could not load discussion history.');
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchConversations(true), 0);
    return () => clearTimeout(t);
  }, [fetchConversations]);

  useEffect(() => {
    if (activeConvId) {
      const t = setTimeout(() => fetchHistory(activeConvId), 0);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setMessages([]), 0);
      return () => clearTimeout(t);
    }
  }, [activeConvId, fetchHistory]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;
    setIsSending(true);

    // Optimistic user message local insertion
    const tempUserMsg: AiMessage = {
      id: generateTempId(),
      conversationId: activeConvId ?? '',
      sender: 'USER',
      text: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');
    setTimeout(scrollToBottom, 50);

    try {
      const res = await apiClient.post('/ai/chat', {
        conversationId: activeConvId,
        text: textToSend,
      });

      const { conversationId, response } = res.data.data;

      // Handle new thread creation side-effect
      if (!activeConvId) {
        setActiveConvId(conversationId);
        fetchConversations();
      } else {
        setMessages((prev) => {
          // Replace user message with API saved state and append Mitra reply
          const filtered = prev.filter((m) => !m.id.startsWith('temp-'));
          return [
            ...filtered,
            {
              id: `${Date.now() - 1}`,
              conversationId,
              sender: 'USER',
              text: textToSend,
              createdAt: new Date().toISOString(),
            },
            response,
          ];
        });
      }
      setTimeout(scrollToBottom, 50);
    } catch {
      addToast('error', 'Message Failed', 'Could not send message. Verify API services.');
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateNewThread = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  return (
    <div className="w-full flex h-[calc(100vh-8.5rem)] gap-6 animate-fade-in">
      {/* ── Left panel: Discussion List ───────────────────────────────────── */}
      <Card className="w-64 p-4 flex flex-col gap-4 shrink-0 h-full hidden md:flex">
        <div className="flex justify-between items-center pb-2 border-b border-border-light">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Discussion History
          </span>
          <button
            onClick={handleCreateNewThread}
            className="p-1 rounded hover:bg-bg-base text-brand-primary hover:text-brand-secondary transition-all"
            title="Start new thread"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable thread cards */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {isLoadingList ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-2 border border-border-light rounded flex flex-col gap-1 animate-pulse"
              >
                <Skeleton variant="text" className="w-2/3 h-3" />
                <Skeleton variant="text" className="w-1/3 h-2" />
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 text-[11px] text-text-muted flex flex-col items-center gap-1">
              <MessageSquare className="h-4 w-4 text-text-muted" />
              <span>No discussions saved yet.</span>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = activeConvId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full text-left p-2.5 text-xs rounded transition-all flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-brand-primary/10 border-l-2 border-brand-primary text-brand-primary font-semibold'
                      : 'hover:bg-bg-base text-text-secondary'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold text-text-primary">
                      {c.title || 'Discussion thread'}
                    </div>
                    <span className="text-[9px] text-text-muted">
                      {new Date(c.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Info panel */}
        <div className="p-3 bg-brand-primary/5 rounded border border-brand-primary/10 flex items-start gap-2 text-[10px] leading-relaxed text-text-secondary">
          <AlertCircle className="h-3.5 w-3.5 text-brand-primary shrink-0 mt-0.5" />
          <span>
            Mitra stores conversation threads securely. Select a thread to load historical sync
            advice.
          </span>
        </div>
      </Card>

      {/* ── Right panel: Chat UI ───────────────────────────────────────────── */}
      <Card className="flex-1 p-0 flex flex-col overflow-hidden h-full">
        {/* Thread Header */}
        <div className="px-5 py-3 border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-primary">Mitra AI Advisor</h4>
              <p className="text-[10px] text-text-muted">IDBI Financial Sync Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewThread}
              className="md:hidden p-1.5 rounded hover:bg-bg-base text-brand-primary transition-all"
              title="Start new thread"
            >
              <Plus className="h-4 w-4" />
            </button>
            {activeConvId && (
              <button
                onClick={() => fetchHistory(activeConvId)}
                disabled={isLoadingHistory}
                className="p-1.5 rounded hover:bg-bg-base text-text-secondary hover:text-text-primary transition-all disabled:opacity-50"
                title="Refresh chat history"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Message Ledger / Prompt Cards */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
          {isLoadingHistory ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex gap-3 max-w-[75%] ${i % 2 === 0 ? 'ml-auto' : ''}`}>
                  <Skeleton variant="circle" className="w-8 h-8 shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton variant="text" className="w-2/3 h-4" />
                    <Skeleton variant="text" className="w-1/2 h-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            /* Starter Prompts Empty State */
            <div className="my-auto flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center animate-bounce">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Ask Mitra Anything</h4>
                <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  I can analyze your balances, explain goal milestones, recommend mutual funds, and
                  help structure your savings.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mt-3">
                {SUGGESTED_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSendMessage(p)}
                    className="p-3 text-left text-xs bg-bg-base border border-border-light hover:border-brand-primary text-text-secondary hover:text-brand-primary rounded transition-all cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Dialogue Thread */
            <div className="flex flex-col gap-4">
              {messages.map((m) => {
                const isUser = m.sender === 'USER';
                return (
                  <div
                    key={m.id}
                    className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Icon bubble */}
                    <div
                      className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold select-none ${
                        isUser
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-secondary/15 text-brand-secondary'
                      }`}
                    >
                      {isUser ? 'ME' : 'MI'}
                    </div>

                    {/* Chat Bubble */}
                    <div
                      className={`rounded p-3 flex flex-col gap-1.5 ${
                        isUser
                          ? 'bg-brand-primary text-white'
                          : 'bg-bg-base border border-border-light text-text-primary'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 pr-2 break-words">
                          {isUser ? m.text : renderMarkdown(m.text)}
                        </div>
                        {!isUser && <CopyButton text={m.text} />}
                      </div>
                      <span
                        className={`text-[8px] self-end mt-0.5 ${
                          isUser ? 'text-white/60' : 'text-text-muted'
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Bot thinking bubble */}
              {isSending && (
                <div className="flex gap-3 max-w-[75%]">
                  <div className="h-8 w-8 rounded-full bg-brand-secondary/15 text-brand-secondary flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-bg-base border border-border-light rounded px-4 py-3 flex items-center gap-1.5 text-xs text-text-muted font-medium">
                    <svg
                      className="animate-spin h-3.5 w-3.5 text-brand-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4"
                      />
                    </svg>
                    <span>Mitra is typing…</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="p-3 border-t border-border-light bg-bg-surface flex items-center gap-3"
        >
          <input
            id="chat-input"
            type="text"
            placeholder={isSending ? 'Waiting for Mitra…' : 'Ask Mitra a question...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            required
            autoComplete="off"
            className="flex-1 bg-bg-base border border-border-light text-xs text-text-primary px-3 py-2 rounded-sq-sm focus:outline-none focus:border-border-focus placeholder:text-text-muted disabled:opacity-50"
            aria-label="Ask Mitra a question"
          />
          <Button type="submit" isLoading={isSending} className="text-xs px-3.5 py-2 shrink-0">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </Card>
    </div>
  );
};
