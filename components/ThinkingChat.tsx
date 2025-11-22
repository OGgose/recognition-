import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/geminiService';
import { ChatMessage } from '../types';

const ThinkingChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendChatMessage(messages, userMsg.text, useSearch);
      
      const modelMsg: ChatMessage = {
        role: 'model',
        text: response.text,
        isThinking: !useSearch, // Assume thinking happened if not using search (since we default to Pro Thinking)
        groundingUrls: response.groundingUrls
      };
      
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden max-w-5xl mx-auto">
      <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          {useSearch ? (
              <span className="flex items-center gap-2 text-blue-400"><span className="text-xl">🌍</span> Search Grounded</span>
          ) : (
              <span className="flex items-center gap-2 text-purple-400"><span className="text-xl">🧠</span> Deep Thinking (Pro)</span>
          )}
        </h2>
        
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
             onClick={() => setUseSearch(false)}
             className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${!useSearch ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Thinking Mode
          </button>
          <button
             onClick={() => setUseSearch(true)}
             className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${useSearch ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Google Search
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p>Ask me anything. I can think deeply or search the web.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-slate-700 text-slate-100 rounded-bl-none'
            }`}>
              {msg.isThinking && (
                 <div className="text-xs text-purple-300 mb-2 flex items-center gap-1 opacity-70 font-mono">
                    <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v2h2v-2zm0-8H9v6h2V5z"/></svg>
                    Thought Process
                 </div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
              
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <p className="text-xs text-slate-400 mb-1">Sources:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {msg.groundingUrls.map((url, uIdx) => (
                      <li key={uIdx} className="text-xs truncate max-w-full">
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{url}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-slate-700 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={useSearch ? "Ask a question about current events..." : "Ask a complex question requiring reasoning..."}
            className="flex-1 bg-slate-800 text-white border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl px-6 font-semibold transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThinkingChat;