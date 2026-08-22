import supabase from '@/lib/supabase';

export interface TierListItem {
  id: string;
  tier_list_id: string;
  content_id: string;
  content_type: 'movie' | 'series' | 'game';
  title: string;
  poster_url: string | null;
  rating: number | null;
  tier: 'SS' | 'S' | 'A' | 'B' | 'C';
  position: number;
  created_at: string;
}

export interface TierList {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items?: TierListItem[];
}

// Create new tier list
export const createTierList = async (
  title: string,
  description: string = '',
  isPublic: boolean = false
): Promise<TierList> => {
  const { data, error } = await supabase
    .from('tier_lists')
    .insert([
      {
        title,
        description,
        is_public: isPublic
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get user's tier lists
export const getUserTierLists = async (): Promise<TierList[]> => {
  const { data, error } = await supabase
    .from('tier_lists')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get public tier lists
export const getPublicTierLists = async (limit: number = 20): Promise<TierList[]> => {
  const { data, error } = await supabase
    .from('tier_lists')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// Get tier list by ID with items
export const getTierListById = async (tierListId: string): Promise<TierList | null> => {
  const { data, error } = await supabase
    .from('tier_lists')
    .select(`
      *,
      tier_list_items (*)
    `)
    .eq('id', tierListId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return data || null;
};

// Update tier list
export const updateTierList = async (
  tierListId: string,
  updates: Partial<TierList>
): Promise<TierList> => {
  const { data, error } = await supabase
    .from('tier_lists')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', tierListId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete tier list
export const deleteTierList = async (tierListId: string): Promise<void> => {
  const { error } = await supabase
    .from('tier_lists')
    .delete()
    .eq('id', tierListId);

  if (error) throw error;
};

// Add item to tier list
export const addTierListItem = async (
  tierListId: string,
  item: Omit<TierListItem, 'id' | 'tier_list_id' | 'created_at'>
): Promise<TierListItem> => {
  const { data, error } = await supabase
    .from('tier_list_items')
    .insert([
      {
        tier_list_id: tierListId,
        ...item
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update tier list item
export const updateTierListItem = async (
  itemId: string,
  updates: Partial<TierListItem>
): Promise<TierListItem> => {
  const { data, error } = await supabase
    .from('tier_list_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete tier list item
export const deleteTierListItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('tier_list_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
};

// Get items for specific tier
export const getTierItems = async (
  tierListId: string,
  tier: string
): Promise<TierListItem[]> => {
  const { data, error } = await supabase
    .from('tier_list_items')
    .select('*')
    .eq('tier_list_id', tierListId)
    .eq('tier', tier)
    .order('position', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Reorder items in tier
export const reorderTierItems = async (
  itemId: string,
  newPosition: number,
  newTier: string
): Promise<TierListItem> => {
  const { data, error } = await supabase
    .from('tier_list_items')
    .update({
      position: newPosition,
      tier: newTier
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
