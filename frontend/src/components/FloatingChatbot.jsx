import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import chatbotService from '../services/chatbot.service';
import ChatBubble from '../components/common/ChatBubble';

const FloatingChatbot = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        sender: 'bot',
        text: `¡Hola ${user?.name || 'amigo'}! 👋 Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
        suggestions: ['Ver mi balance', 'Gastos del mes', 'Estado del presupuesto', 'Consejos de ahorro']
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text = inputValue) => {
    if (!text.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const data = await chatbotService.sendMessage(text.trim());
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: data.reply,
        timestamp: new Date(),
        suggestions: data.suggestions || []
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Lo siento, no puedo responder en este momento. Inténtalo de nuevo más tarde.',
        timestamp: new Date(),
        suggestions: []
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-3">
      {/* Mobile Fullscreen */}
      {isOpen && (
        <>
          {/* Mobile: Fullscreen */}
          <div className="fixed inset-0 bg-white dark:bg-gray-900 md:hidden flex flex-col z-[9999]">
            {/* Mobile Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-indigo-200 flex items-center gap-2 min-h-[44px]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-semibold">Volver</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg">💰</div>
                <div className="text-left">
                  <h2 className="text-white font-semibold text-sm">Asistente Financiero</h2>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    <span className="text-indigo-200 text-xs">En línea</span>
                  </div>
                </div>
              </div>
              <div className="w-24"></div>
            </div>

            {/* Mobile Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950"
              style={{ height: 'calc(100vh - 64px - 72px)' }}
            >
              {messages.map((msg, idx) => (
                <div key={msg.id}>
                  <ChatBubble
                    message={msg}
                    isUser={msg.sender === 'user'}
                  />
                  {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && !loading && (
                    <div className="flex flex-wrap gap-2 ml-12 mb-3 mt-2">
                      {msg.suggestions.map((suggestion, sidx) => (
                        <button
                          key={sidx}
                          onClick={() => sendMessage(suggestion)}
                          className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    💰
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Mobile Input */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3" style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
              <div className="flex gap-2 items-end">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  rows={1}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none overflow-hidden text-base"
                  style={{ maxHeight: '100px' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !inputValue.trim()}
                  className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop: Floating Window */}
          <div className="hidden md:flex bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden w-96 h-[600px] flex-col border border-gray-200 dark:border-gray-700">
            {/* Desktop Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg">💰</div>
                <div>
                  <h2 className="text-white font-semibold text-sm">Asistente Financiero</h2>
                  <p className="text-indigo-200 text-xs">En línea</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-indigo-200 transition-colors min-h-[44px]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Desktop Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950">
              {messages.map((msg, idx) => (
                <div key={msg.id}>
                  <ChatBubble
                    message={msg}
                    isUser={msg.sender === 'user'}
                  />
                  {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && !loading && (
                    <div className="flex flex-wrap gap-2 ml-12 mb-3 mt-2">
                      {msg.suggestions.map((suggestion, sidx) => (
                        <button
                          key={sidx}
                          onClick={() => sendMessage(suggestion)}
                          className="px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                    💰
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef}></div>
            </div>

            {/* Desktop Input */}
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="flex gap-2 items-end">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..."
                  rows={1}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none overflow-hidden text-sm"
                  style={{ maxHeight: '100px' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !inputValue.trim()}
                  className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'hidden md:flex bg-red-500 hover:bg-red-600' 
            : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800'
        }`}
      >
        {isOpen ? (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default FloatingChatbot;
