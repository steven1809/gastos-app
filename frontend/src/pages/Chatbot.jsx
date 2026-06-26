import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import chatbotService from '../services/chatbot.service';
import ChatBubble from '../components/common/ChatBubble';

const Chatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const welcomeMessage = {
      id: Date.now(),
      sender: 'bot',
      text: `¡Hola ${user?.name || 'amigo'}! 👋 Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
      suggestions: ['Ver mi balance', 'Gastos del mes', 'Estado del presupuesto', 'Consejos de ahorro']
    };
    setMessages([welcomeMessage]);
  }, [user]);

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
    setMessages(prev => [...prev, userMessage]);
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
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Lo siento, no puedo responder en este momento. Inténtalo de nuevo más tarde.',
        timestamp: new Date(),
        suggestions: []
      };
      setMessages(prev => [...prev, errorMessage]);
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
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          💬 Asistente Financiero
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={msg.id}>
              <ChatBubble
                message={msg}
                isUser={msg.sender === 'user'}
              />
              {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && !loading && (
                <div className="flex flex-wrap gap-2 ml-14 mb-4">
                  {msg.suggestions.map((suggestion, sidx) => (
                    <button
                      key={sidx}
                      onClick={() => sendMessage(suggestion)}
                      className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                💰
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje aquí... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none overflow-hidden"
            style={{ maxHeight: '150px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !inputValue.trim()}
            className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
