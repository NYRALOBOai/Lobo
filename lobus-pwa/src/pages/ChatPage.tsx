import React, { useState } from 'react';
import LLMService from '../services/LLMService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const llmService = new LLMService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const newHistory: Message[] = [...chatHistory, { role: 'user', content: prompt }];
    setChatHistory(newHistory);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await llmService.send(prompt, chatHistory);
      setChatHistory([...newHistory, { role: 'assistant', content: response }]);
    } catch (error: any) {
      setChatHistory([...newHistory, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4" style={{ paddingBottom: '70px' }}>
      <h1 className="text-2xl font-bold mb-4 text-center">Lóbus Nexus</h1>

      <div className="flex-grow overflow-y-auto mb-4 p-2 bg-gray-800 rounded">
        {chatHistory.map((message, index) => (
          <div key={index} className={`mb-2 p-3 rounded-lg shadow ${message.role === 'user' ? 'bg-blue-600 text-right ml-auto' : 'bg-gray-700 text-left mr-auto'}`} style={{ maxWidth: '80%' }}>
            <p className="text-sm font-semibold capitalize mb-1">{message.role}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ))}
        {isLoading && <p className="text-center text-gray-400 mt-2">Lóbus is thinking...</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex fixed bottom-16 left-0 right-0 p-4 bg-gray-900 border-t border-gray-700">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Lóbus anything..."
          className="flex-grow p-2 rounded-l bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700 disabled:bg-gray-500"
          disabled={isLoading || !prompt.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatPage;
