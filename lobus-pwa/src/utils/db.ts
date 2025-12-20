import { openDB, DBSchema } from 'idb';

interface Memory {
  id: number;
  content: string;
  embedding: number[];
  tags: string[];
  timestamp: string;
}

interface LobusNexusDB extends DBSchema {
  memories: {
    key: number;
    value: Memory;
    indexes: { embedding: number[] };
  };
}

const DB_NAME = 'LobusNexusDB';
const STORE_NAME = 'memories';
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB<LobusNexusDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('embedding', 'embedding', { unique: false });
      }
    },
  });
  return db;
};
