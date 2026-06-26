import React from 'react';

const ChatBubble = ({ message, isUser }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
          💰
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
        <span className="text-xs text-gray-400 mt-1 px-2">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;
