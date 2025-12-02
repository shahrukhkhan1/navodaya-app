import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../types';
import Message from './Message';
import SendIcon from './icons/SendIcon';
import MicIcon from './icons/MicIcon';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onReset: () => void;
  isSolved: boolean;
  onRequestPracticeProblem: () => void;
}

// Add type definition for window.SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 my-4 justify-start">
     <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-cyan-400 flex-shrink-0">
        🧠
      </div>
      <div className="max-w-md lg:max-w-xl px-4 py-3 rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none flex items-center space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      </div>
  </div>
);

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, onReset, isSolved, onRequestPracticeProblem }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const toggleListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("आपका ब्राउज़र वॉइस इनपुट का समर्थन नहीं करता है। (Your browser does not support voice input.)");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Default to Hindi India
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening]);
  
  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold">ट्यूटरिंग सत्र</h2>
            <button 
                onClick={onReset}
                className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md transition-colors"
            >
                नया प्रश्न शुरू करें
            </button>
        </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-700">
        {isSolved && !isLoading && (
            <div className="mb-3 text-center">
                <button
                    onClick={onRequestPracticeProblem}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    अगले प्रश्न के लिए तैयार हैं? एक अभ्यास प्रश्न बनाएँ!
                </button>
            </div>
        )}
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "सुन रहा हूँ..." : "प्रश्न पूछें (लिखें या माइक दबाएं)..."}
            disabled={isLoading || isSolved}
            className={`flex-1 border rounded-lg py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 transition-colors ${
              isListening 
              ? 'bg-red-900/20 border-red-500 text-white placeholder-red-300' 
              : 'bg-gray-700 border-gray-600 text-white'
            }`}
            aria-label="Chat input"
          />
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading || isSolved}
            className={`p-2 rounded-full transition-all relative ${
              isListening 
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="बोलकर टाइप करें (Speak to type)"
          >
            <MicIcon className="w-5 h-5" />
            {isListening && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isSolved}
            className="bg-cyan-600 text-white p-2 rounded-full hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;