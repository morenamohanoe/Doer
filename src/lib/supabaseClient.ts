import { createClient } from '@supabase/supabase-js';

// Load variables securely from environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Lazy initialization of Supabase client to avoid crash if env keys are not set yet
let supabaseInstance: any = null;

export function getSupabase() {
  if (!supabaseInstance) {
    if (supabaseUrl && supabaseAnonKey) {
      try {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase Client initialized successfully with environment keys! ⚡");
      } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
      }
    } else {
      console.warn(
        "Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY) are missing. Falling back to local offline storage mode."
      );
    }
  }
  return supabaseInstance;
}

// Interfaces aligned with user database schemas
export interface SavedItemDB {
  id: string;
  user_id: string;
  item_type: 'service' | 'product';
  item_id: string;
  created_at: string;
}

export interface PortfolioProjectDB {
  id: string;
  user_id: string;
  job_id?: string;
  title: string;
  description: string;
  cover_image_url: string;
  is_verified: boolean;
  created_at: string;
}

export interface PortfolioImageDB {
  id: string;
  project_id: string;
  image_url: string;
  thumbnail_url: string;
  image_type: 'before' | 'during' | 'after' | 'general';
  sort_order: number;
  created_at: string;
}

/**
 * Sync operations helper for offline-first resilience.
 * Always performs optimistic local updates and queues/pushes background syncs when online.
 */
export const supabaseSync = {
  // --- SAVED ITEMS SYSTEM ---
  async saveItem(item: SavedItemDB): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) {
      this._offlineSave('saved_items', item);
      return true;
    }
    try {
      const { error } = await supabase.from('saved_items').upsert(item);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase Sync saveItem failed, caching offline:", err);
      this._offlineSave('saved_items', item);
      return false;
    }
  },

  async removeItem(itemId: string, itemType: 'service' | 'product'): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) {
      this._offlineRemove('saved_items', itemId, itemType);
      return true;
    }
    try {
      const { error } = await supabase
        .from('saved_items')
        .delete()
        .eq('item_id', itemId)
        .eq('item_type', itemType);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase Sync removeItem failed, updating offline cache:", err);
      this._offlineRemove('saved_items', itemId, itemType);
      return false;
    }
  },

  // --- PORTFOLIO SYSTEM ---
  async syncProject(project: PortfolioProjectDB): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) {
      this._offlineSave('portfolio_projects', project);
      return true;
    }
    try {
      const { error } = await supabase.from('portfolio_projects').upsert(project);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase Sync syncProject failed, caching offline:", err);
      this._offlineSave('portfolio_projects', project);
      return false;
    }
  },

  async syncPortfolioImages(images: PortfolioImageDB[]): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) {
      images.forEach(img => this._offlineSave('portfolio_images', img));
      return true;
    }
    try {
      const { error } = await supabase.from('portfolio_images').upsert(images);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error("Supabase Sync syncPortfolioImages failed, caching offline:", err);
      images.forEach(img => this._offlineSave('portfolio_images', img));
      return false;
    }
  },

  // Private local cache backups
  _offlineSave(table: string, data: any) {
    try {
      const cache = JSON.parse(localStorage.getItem(`offline_${table}`) || '[]');
      const filtered = cache.filter((item: any) => item.id !== data.id);
      localStorage.setItem(`offline_${table}`, JSON.stringify([...filtered, data]));
    } catch (e) {
      console.error("LocalStorage write failed:", e);
    }
  },

  _offlineRemove(table: string, itemId: string, itemType?: string) {
    try {
      const cache = JSON.parse(localStorage.getItem(`offline_${table}`) || '[]');
      const updated = cache.filter((item: any) => {
        if (table === 'saved_items') {
          return !(item.item_id === itemId && item.item_type === itemType);
        }
        return item.id !== itemId;
      });
      localStorage.setItem(`offline_${table}`, JSON.stringify(updated));
    } catch (e) {
      console.error("LocalStorage remove failed:", e);
    }
  }
};
