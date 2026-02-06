import { useState, useRef, useEffect } from 'react';
import { sendAssistantChat } from '../api/assistant';
import { Send, Bot, X, GripVertical } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

interface ChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  onResize: (newWidth: number) => void;
}

export default function ChatWidget({ isOpen, onClose, width, onResize }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant' as const, content: 'Hi! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        onResize(newWidth);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const send = async () => {
    if (!input.trim() || sending) return;
    const newMessages: Msg[] = [...messages, { role: 'user' as const, content: input.trim() }];
    setMessages(newMessages);
    setInput('');
    setSending(true);
    setError(null);
    try {
      const result = await sendAssistantChat(newMessages);
      setMessages([...newMessages, { role: 'assistant' as const, content: result.content }]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Request failed';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{ width: `${width}px` }}
      className="fixed inset-y-0 right-0 z-50 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col"
    >
      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-gray-600 transition-colors flex items-center justify-center -ml-0.5 z-50 group opacity-0 hover:opacity-100"
      >
        <div className="h-16 w-1 bg-gray-600 rounded-full shadow-lg" />
      </div>

      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-gray-900 text-white shadow-md relative z-10 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-full backdrop-blur-md shadow-inner border border-white/5">
            <Bot size={24} className="text-white drop-shadow-sm" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-lg block leading-tight tracking-tight text-gray-100 drop-shadow-sm">Farm Assistant</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-white hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all duration-200 shadow-inner border border-white/5"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-950/50 relative scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent hover:scrollbar-thumb-gray-700 direction-rtl">
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <Bot size={300} className="text-gray-200/40 dark:text-gray-800/40" strokeWidth={1.5} />
        </div>

        <div className="direction-ltr space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex relative z-10 ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              {m.role === 'assistant' && (
                 <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3 shadow-md mt-1 shrink-0 border border-white/10">
                   <Bot size={16} className="text-gray-200" strokeWidth={2.5} />
                 </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm leading-relaxed break-words whitespace-pre-wrap ${
                  m.role === 'assistant'
                    ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                    : 'bg-gray-800 text-white rounded-tr-sm shadow-gray-900/10'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start relative z-10">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3 shadow-md mt-1 shrink-0 opacity-50">
                   <Bot size={16} className="text-gray-200" strokeWidth={2.5} />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-5 py-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 shadow-sm">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </span>
              </div>
            </div>
          )}
          {error && (
            <div className="mx-auto max-w-[90%] p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900/20 text-center shadow-sm relative z-10">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-5 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.03)] z-20">
        <div className="flex gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-[24px] border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-gray-500/20 focus-within:border-gray-500 transition-all shadow-inner items-end">
          <textarea
            ref={textareaRef}
            className="flex-1 px-4 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none max-h-[120px] overflow-y-auto"
            placeholder="Ask anything..."
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="p-2.5 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 disabled:active:scale-100 mb-0.5"
            onClick={send}
            disabled={sending || !input.trim()}
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
