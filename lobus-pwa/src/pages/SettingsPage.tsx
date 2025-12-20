import React from 'react';
import { useAppStore } from '../store/useAppStore';

const SettingsPage: React.FC = () => {
  const { activeProvider, providers, rag, systemIdentity, set } = useAppStore();

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    set((state) => ({ ...state, activeProvider: e.target.value as any }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, ...path: string[]) => {
    const { name, value } = e.target;
    set(state => {
      let nested = state;
      for (let i = 0; i < path.length - 1; i++) {
        nested = nested[path[i]];
      }
      nested[path[path.length - 1]] = { ...nested[path[path.length - 1]], [name]: value };
      return { ...state };
    });
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div>
        <label className="block text-lg font-semibold mb-2">Active LLM Provider</label>
        <select
          value={activeProvider}
          onChange={handleProviderChange}
          className="w-full p-2 bg-gray-700 rounded border border-gray-600"
        >
          <option value="ollama_local">Ollama (Local)</option>
          <option value="ollama_cloud">Ollama (Cloud)</option>
          <option value="google">Google Gemini</option>
          <option value="openai">OpenAI / OpenRouter</option>
        </select>
      </div>

      <div className="p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-semibold mb-3">Ollama Configuration</h2>
        <div className="mb-3">
          <label className="block mb-1">Base URL</label>
          <input type="text" name="baseUrl" value={providers.ollama.baseUrl} onChange={e => handleInputChange(e, 'providers', 'ollama')} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1">API Key (Optional)</label>
          <input type="password" name="apiKey" value={providers.ollama.apiKey || ''} onChange={e => handleInputChange(e, 'providers', 'ollama')} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-semibold mb-3">Google Gemini Configuration</h2>
        <div>
          <label className="block mb-1">API Key</label>
          <input type="password" name="apiKey" value={providers.google.apiKey} onChange={e => handleInputChange(e, 'providers', 'google')} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-semibold mb-3">OpenAI / OpenRouter Configuration</h2>
        <div>
          <label className="block mb-1">API Key</label>
          <input type="password" name="apiKey" value={providers.openai.apiKey} onChange={e => handleInputChange(e, 'providers', 'openai')} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-semibold mb-3">Google Workspace Configuration</h2>
        <div className="mb-3">
          <label className="block mb-1">Client ID</label>
          <input type="text" name="clientId" value={providers.google.clientId} onChange={e => handleInputChange(e, 'providers', 'google')} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Client Secret</label>
          <input type="password" name="clientSecret" value={providers.google.clientSecret} onChange={e => handleInputChange(e, 'providers', 'google')} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
        </div>
        <div>
          <label className="block mb-1">Redirect URI</label>
          <input type="text" name="redirectUri" value={providers.google.redirectUri} onChange={e => handleInputChange(e, 'providers', 'google')} className="w-full p-2 bg-gray-700 rounded border border-gray-600" />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
