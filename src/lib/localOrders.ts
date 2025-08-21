export type LocalOrderPayload = {
  title: string;
  description: string;
  price: number;
  comments?: string;
  total_pages?: number;
  total_sections?: number;
  siteType?: string;
  sessionId?: string;
  wizardData?: unknown;
};

export type LocalOrder = {
  id: string; // starts with local_
  created_at: string;
  updated_at: string;
  payload: LocalOrderPayload;
};

const STORAGE_KEY = 'arzansite_local_orders';

function readAll(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(orders: LocalOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

export const localOrders = {
  list(): LocalOrder[] {
    return readAll();
  },

  get(id: string): LocalOrder | undefined {
    return readAll().find((o) => o.id === id);
  },

  save(payload: LocalOrderPayload): LocalOrder {
    const order: LocalOrder = {
      id: `local_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payload,
    };
    const all = readAll();
    all.unshift(order);
    writeAll(all);
    return order;
  },

  remove(id: string): void {
    const all = readAll();
    writeAll(all.filter((o) => o.id !== id));
  },
};


