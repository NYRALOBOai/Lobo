import { initDB } from '../utils/db';
import { useAppStore } from '../store/useAppStore';
import LLMService from './LLMService';

// Simple cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class RAGEngine {
  private dbPromise = initDB();
  private llmService: LLMService;

  constructor(llmService: LLMService) {
    this.llmService = llmService;
  }

  private async getEmbedding(text: string): Promise<number[]> {
    return this.llmService.generateEmbedding(text);
  }

  async addMemory(content: string, tags: string[] = []): Promise<number> {
    const db = await this.dbPromise;
    const embedding = await this.getEmbedding(content);
    const memory = {
      content,
      embedding,
      tags,
      timestamp: new Date().toISOString(),
    };
    // @ts-ignore
    const id = await db.add('memories', memory);
    return id;
  }

  async searchMemories(queryText: string, topK = 3): Promise<any[]> {
    const db = await this.dbPromise;
    const queryEmbedding = await this.getEmbedding(queryText);

    const allMemories = await db.getAll('memories');

    if (!allMemories.length) {
      return [];
    }

    const scoredMemories = allMemories.map(mem => ({
      ...mem,
      similarity: cosineSimilarity(queryEmbedding, mem.embedding),
    }));

    scoredMemories.sort((a, b) => b.similarity - a.similarity);

    const { rag } = useAppStore.getState();
    const threshold = rag.similarityThreshold;
    return scoredMemories.filter(mem => mem.similarity >= threshold).slice(0, topK);
  }

  async getAllMemories() {
    const db = await this.dbPromise;
    return db.getAll('memories');
  }

  async deleteMemory(id: number) {
    const db = await this.dbPromise;
    await db.delete('memories', id);
  }
}

export default RAGEngine;
