import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, Trash2, GripVertical, Film, Tv, Gamepad, Book, Music } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TopList {
  id: string;
  title: string;
  media_type: 'movie' | 'anime' | 'book' | 'music' | 'game';
  items?: TopListItem[];
}

interface TopListItem {
  id: string;
  rank: number;
  title?: string;
  poster_url?: string;
  item_id: string;
}

const mediaIcons = {
  movie: Film,
  anime: Tv,
  game: Gamepad,
  book: Book,
  music: Music,
};

const SortableItem = ({ item, onRemove }: { item: TopListItem; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <span className="font-bold text-primary w-8">#{item.rank}</span>
      {item.poster_url && (
        <img src={item.poster_url} alt="" className="w-12 h-16 object-cover rounded" />
      )}
      <span className="flex-1">{item.title || `Item ${item.rank}`}</span>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

const TopListsManager = ({ userId, isOwnProfile }: { userId: string; isOwnProfile: boolean }) => {
  const [lists, setLists] = useState<TopList[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [newListType, setNewListType] = useState<'movie' | 'anime' | 'book' | 'music' | 'game'>('movie');
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchLists();
  }, [userId]);

  const fetchLists = async () => {
    try {
      const { data: listsData, error: listsError } = await supabase
        .from('top_lists')
        .select('*')
        .eq('user_id', userId);

      if (listsError) throw listsError;

      const listsWithItems = await Promise.all(
        (listsData || []).map(async (list) => {
          const { data: items } = await supabase
            .from('top_list_items')
            .select('*')
            .eq('top_list_id', list.id)
            .order('rank');
          return { ...list, items: items || [] };
        })
      );

      setLists(listsWithItems);
    } catch (error: any) {
      toast.error('Failed to load lists');
    } finally {
      setLoading(false);
    }
  };

  const createList = async () => {
    if (!newListTitle.trim()) return;

    try {
      const { error } = await supabase.from('top_lists').insert({
        user_id: userId,
        title: newListTitle,
        media_type: newListType,
      });

      if (error) throw error;
      toast.success('List created!');
      setNewListTitle("");
      setShowCreateDialog(false);
      fetchLists();
    } catch (error: any) {
      toast.error('Failed to create list');
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase.from('top_lists').delete().eq('id', listId);
      if (error) throw error;
      toast.success('List deleted');
      fetchLists();
    } catch (error: any) {
      toast.error('Failed to delete list');
    }
  };

  const handleDragEnd = async (event: any, listId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const list = lists.find((l) => l.id === listId);
    if (!list?.items) return;

    const oldIndex = list.items.findIndex((item) => item.id === active.id);
    const newIndex = list.items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(list.items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, items: newItems } : l))
    );

    try {
      await Promise.all(
        newItems.map((item) =>
          supabase.from('top_list_items').update({ rank: item.rank }).eq('id', item.id)
        )
      );
    } catch (error: any) {
      toast.error('Failed to update order');
    }
  };

  const removeItem = async (listId: string, itemId: string) => {
    try {
      const { error } = await supabase.from('top_list_items').delete().eq('id', itemId);
      if (error) throw error;
      toast.success('Item removed');
      fetchLists();
    } catch (error: any) {
      toast.error('Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isOwnProfile && (
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Top List
        </Button>
      )}

      {lists.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No top lists yet</p>
          </CardContent>
        </Card>
      ) : (
        lists.map((list) => {
          const Icon = mediaIcons[list.media_type];
          return (
            <Card key={list.id} className="card-glow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {list.title}
                  </CardTitle>
                  {isOwnProfile && (
                    <Button variant="ghost" size="icon" onClick={() => deleteList(list.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!list.items || list.items.length === 0 ? (
                  <p className="text-muted-foreground">No items yet</p>
                ) : isOwnProfile ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, list.id)}
                  >
                    <SortableContext items={list.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {list.items.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onRemove={() => removeItem(list.id, item.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="space-y-2">
                    {list.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border">
                        <span className="font-bold text-primary w-8">#{item.rank}</span>
                        {item.poster_url && (
                          <img src={item.poster_url} alt="" className="w-12 h-16 object-cover rounded" />
                        )}
                        <span className="flex-1">{item.title || `Item ${item.rank}`}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Top List</DialogTitle>
            <DialogDescription>Create a custom top list for your favorite content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">List Title</label>
              <Input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="e.g., My Top 10 Sci-Fi Movies"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Media Type</label>
              <Select value={newListType} onValueChange={(v: any) => setNewListType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="movie">Movies</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="game">Games</SelectItem>
                  <SelectItem value="book">Books</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={createList} className="w-full">
              Create List
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopListsManager;
