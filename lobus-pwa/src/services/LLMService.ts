import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import RAGEngine from './RAGEngine';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

class LLMService {
  private ragEngine = new RAGEngine(this);

  async generateEmbedding(text: string): Promise<number[]> {
    // This will be expanded to support other embedding providers
    const { providers } = useAppStore.getState();
    const { baseUrl, model, apiKey } = providers.ollama;
    if (!baseUrl) throw new Error('Ollama base URL is not set for embeddings.');

    const headers: any = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
      const response = await axios.post(
        `${baseUrl}/api/embeddings`,
        { model, prompt: text },
        { headers }
      );
      return response.data.embedding;
    } catch (error: any) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  async send(prompt: string, chatHistory: any[] = []): Promise<string> {
    const { activeProvider, providers, systemIdentity, rag } = useAppStore.getState();

    let finalPrompt = prompt;
    // RAG augmentation
    if (rag.enabled) {
      const relevantMemories = await this.ragEngine.searchMemories(prompt);
      if (relevantMemories.length > 0) {
        const context = relevantMemories.map(mem => mem.content).join('\n---\n');
        finalPrompt = `Based on the following memories:\n${context}\n\nQuestion: ${prompt}`;
      }
    }

    const messages = [
      { role: 'system', content: systemIdentity },
      ...chatHistory,
      { role: 'user', content: finalPrompt },
    ];

    try {
      switch (activeProvider) {
        case 'ollama_local':
        case 'ollama_cloud': {
          const { baseUrl, model, apiKey } = providers.ollama;
          if (!baseUrl) throw new Error('Ollama base URL is not set.');
          const headers: any = {};
          if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

          const response = await axios.post(`${baseUrl}/api/chat`, { model, messages, stream: false }, { headers });
          return response.data.message.content;
        }

        case 'google': {
          const { apiKey } = providers.google;
          if (!apiKey) throw new Error('Google API key is not set.');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-pro" });

          const chat = model.startChat({
            history: [
              ...chatHistory.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
              { role: 'system', parts: [{ text: systemIdentity }] } // Gemini doesn't have a system role, but we can prepend it.
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
          });

          const result = await chat.sendMessage(finalPrompt);
          return result.response.text();
        }

        case 'openai': {
          const { apiKey } = providers.openai;
          if (!apiKey) throw new Error('OpenAI API key is not set.');

          const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "openai/gpt-4-turbo", // or any other model
            messages: messages,
          }, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          return response.data.choices[0].message.content;
        }

        default:
          throw new Error(`Unsupported LLM provider: ${activeProvider}`);
      }
    } catch (error: any) {
      console.error('Error communicating with LLM provider:', error);
      return `Error: ${error.response ? (error.response.data.error || error.message) : error.message}`;
    }
  }
}

export default LLMService;
