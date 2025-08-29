import {
  DBSchema,
  deleteDB,
  IDBPDatabase,
  openDB,
} from 'idb';

// =======================
// DB Schema định nghĩa
// =======================
export type AppDBSchema = DBSchema & {
  items: {
    key: string;
    value: any;
  };
}

// =======================
// Core Init
// =======================
export const initDB = async (
  name: string = "AppDB",
  version: number = 1
): Promise<IDBPDatabase<AppDBSchema>> => {
  return await openDB<AppDBSchema>(name, version, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("items")) {
        db.createObjectStore("items", { keyPath: "id" });
      }
    },
  });
};

// =======================
// CRUD helpers
// =======================
export const db = {
  add: async (data: { id: string; [key: string]: any }, dbName?: string) => {
    try {
      if (!data?.id) throw new Error("id is required");
      const db = await initDB(dbName);
      await db.put("items", data);
      return { success: true, message: "Item added" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  get: async (id: string, dbName?: string) => {
    try {
      if (!id) throw new Error("id is required");
      const db = await initDB(dbName);
      const item = await db.get("items", id);
      return item
        ? { success: true, data: item }
        : { success: false, message: "Item not found" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  getAll: async (dbName?: string) => {
    try {
      const db = await initDB(dbName);
      const items = await db.getAll("items");
      return { success: true, data: items };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  update: async (id: string, updatedData: any, dbName?: string) => {
    try {
      const db = await initDB(dbName);
      const item = await db.get("items", id);
      if (!item) return { success: false, message: "Item not found" };
      const newItem = { ...item, ...updatedData };
      await db.put("items", newItem);
      return { success: true, message: "Item updated" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  delete: async (id: string, dbName?: string) => {
    try {
      const db = await initDB(dbName);
      await db.delete("items", id);
      return { success: true, message: "Item deleted" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  clear: async (dbName?: string) => {
    try {
      const db = await initDB(dbName);
      await db.clear("items");
      return { success: true, message: "All items cleared" };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },
};

// =======================
// DB Management helpers
// =======================
export const dbManager = {
  createDB: async (name: string, version: number = 1) => {
    try {
      await openDB(name, version, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("items")) {
            db.createObjectStore("items", { keyPath: "id" });
          }
        },
      });
      return { success: true, message: `DB ${name} created` };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  deleteDB: async (name: string) => {
    try {
      await deleteDB(name);
      return { success: true, message: `DB ${name} deleted` };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  listDBs: async () => {
    try {
      if ("databases" in indexedDB) {
        const dbs = await (indexedDB as any).databases();
        return { success: true, data: dbs };
      }
      return {
        success: false,
        message: "listDBs not supported in this browser",
      };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },

  clearAllDBs: async () => {
    try {
      if ("databases" in indexedDB) {
        const dbs = await (indexedDB as any).databases();
        for (const db of dbs) {
          if (db.name) await deleteDB(db.name);
        }
        return { success: true, message: "All DBs cleared" };
      }
      return {
        success: false,
        message: "clearAllDBs not supported in this browser",
      };
    } catch (err) {
      return { success: false, message: String(err) };
    }
  },
};
