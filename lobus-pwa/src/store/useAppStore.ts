import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OllamaSettings {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

interface GoogleSettings {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface OpenAISettings {
  apiKey: string;
}

interface RagSettings {
  enabled: boolean;
  embeddingSource: 'local' | 'api';
  similarityThreshold: number;
}

interface AppState {
  activeProvider: 'ollama_local' | 'ollama_cloud' | 'google' | 'openai';
  providers: {
    ollama: OllamaSettings;
    google: GoogleSettings;
    openai: OpenAISettings;
  };
  rag: RagSettings;
  systemIdentity: string;
  set: (fn: (state: AppState) => AppState) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeProvider: 'ollama_local',
      providers: {
        ollama: { baseUrl: 'http://127.0.0.1:11434', model: 'llama3' },
        google: { apiKey: '', clientId: '', clientSecret: '', redirectUri: '' },
        openai: { apiKey: '' },
      },
      rag: {
        enabled: true,
        embeddingSource: 'local',
        similarityThreshold: 0.75,
      },
      systemIdentity: 'You are Lóbus, a strategic analyst companion...',
      set,
    }),
    {
      name: 'lobus-nexus-storage',
    }
  )
);
