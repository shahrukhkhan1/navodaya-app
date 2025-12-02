import React from 'react';
import { MessageAuthor } from '../types';
import type { ChatMessage } from '../types';
// Note: You need to install 'react-markdown' and 'remark-gfm' for this to work.
// npm install react-markdown remark-gfm
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.author === MessageAuthor.USER;

  const wrapperClasses = `flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`;
  const bubbleClasses = `max-w-md lg:max-w-xl px-4 py-3 rounded-2xl ${
    isUser
      ? 'bg-cyan-600 text-white rounded-br-none'
      : 'bg-gray-700 text-gray-200 rounded-bl-none'
  }`;

  return (
    <div className={wrapperClasses}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-cyan-400 flex-shrink-0">
          🧠
        </div>
      )}
      <div className={bubbleClasses}>
        <div className="prose prose-invert prose-p:my-0 prose-code:text-cyan-300 prose-code:before:content-none prose-code:after:content-none prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      {isUser && (
         <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-gray-200 flex-shrink-0">
          🧑‍🎓
        </div>
      )}
    </div>
  );
};

export default Message;
