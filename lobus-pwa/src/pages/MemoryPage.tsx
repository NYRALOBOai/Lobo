import React, { useState, useEffect, useMemo } from 'react';
import RAGEngine from '../services/RAGEngine';
import LLMService from '../services/LLMService';

const MemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<any[]>([]);
  const [newMemory, setNewMemory] = useState('');

  // Memoize the service instances to avoid re-creation on every render
  const llmService = useMemo(() => new LLMService(), []);
  const ragEngine = useMemo(() => new RAGEngine(llmService), [llmService]);

  useEffect(() => {
    fetchMemories();
  }, [ragEngine]);

  const fetchMemories = async () => {
    const allMemories = await ragEngine.getAllMemories();
    setMemories(allMemories);
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;
    await ragEngine.addMemory(newMemory);
    setNewMemory('');
    fetchMemories();
  };

  const handleDeleteMemory = async (id: number) => {
    await ragEngine.deleteMemory(id);
    fetchMemories();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Memory Inspector</h1>

      <form onSubmit={handleAddMemory} className="flex mb-4">
        <input
          type="text"
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="Add a new memory..."
          className="flex-grow p-2 rounded-l bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700">
          Add Memory
        </button>
      </form>

      <div className="space-y-2">
        {memories.length > 0 ? (
          memories.map((memory) => (
            <div key={memory.id} className="bg-gray-800 p-3 rounded flex justify-between items-center">
              <p className="flex-grow">{memory.content}</p>
              <button
                onClick={() => handleDeleteMemory(memory.id)}
                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">No memories stored yet.</p>
        )}
      </div>
    </div>
  );
};

export default MemoryPage;
