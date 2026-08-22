import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Share2, Eye, Lock } from 'lucide-react';
import {
  createTierList,
  getUserTierLists,
  getTierListById,
  updateTierList,
  deleteTierList,
  addTierListItem,
  deleteTierListItem,
  updateTierListItem,
  TierList,
  TierListItem
} from '@/utils/tierListService';
import TierListSearch from '@/components/TierListSearch';
import TierListDisplay from '@/components/TierListDisplay';
import PopularContent from '@/components/PopularContent';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  title: string;
  poster: string;
  rating: number;
  description: string;
  contentType: 'movie' | 'series' | 'game';
  tmdbId?: number;
}

const TierListsPage = () => {
  const { user } = useAppContext();
  const { toast } = useToast();
  const [tierLists, setTierLists] = useState<TierList[]>([]);
  const [selectedTierList, setSelectedTierList] = useState<TierList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTierListTitle, setNewTierListTitle] = useState('');
  const [newTierListDescription, setNewTierListDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadTierLists();
  }, [user]);

  const loadTierLists = async () => {
    try {
      setLoading(true);
      const lists = await getUserTierLists();
      setTierLists(lists);
      if (lists.length > 0 && !selectedTierList) {
        const fullList = await getTierListById(lists[0].id);
        setSelectedTierList(fullList);
      }
    } catch (error) {
      console.error('Error loading tier lists:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить тир-листы',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTierList = async () => {
    if (!newTierListTitle.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите название тир-листа',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      const newList = await createTierList(
        newTierListTitle,
        newTierListDescription,
        isPublic
      );
      setTierLists([newList, ...tierLists]);
      const fullList = await getTierListById(newList.id);
      setSelectedTierList(fullList);
      setNewTierListTitle('');
      setNewTierListDescription('');
      setIsPublic(false);
      toast({
        title: 'Успех',
        description: 'Тир-лист создан',
      });
    } catch (error) {
      console.error('Error creating tier list:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать тир-лист',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddItem = async (searchResult: SearchResult) => {
    if (!selectedTierList) {
      toast({
        title: 'Ошибка',
        description: 'Выберите тир-лист',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newItem = await addTierListItem(selectedTierList.id, {
        content_id: searchResult.id,
        content_type: searchResult.contentType,
        title: searchResult.title,
        poster_url: searchResult.poster,
        rating: searchResult.rating,
        tier: 'A',
        position: 0
      });

      setSelectedTierList({
        ...selectedTierList,
        items: [...(selectedTierList.items || []), newItem]
      });

      toast({
        title: 'Успех',
        description: `${searchResult.title} добавлен в тир-лист`,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить элемент',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedTierList) return;

    try {
      await deleteTierListItem(itemId);
      setSelectedTierList({
        ...selectedTierList,
        items: selectedTierList.items?.filter(item => item.id !== itemId)
      });
      toast({
        title: 'Успех',
        description: 'Элемент удален из тир-листа',
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить элемент',
        variant: 'destructive',
      });
    }
  };

  const handleReorderItems = async (newItems: TierListItem[]) => {
    if (!selectedTierList) return;

    try {
      // Update all items in parallel
      await Promise.all(
        newItems.map(item =>
          updateTierListItem(item.id, {
            tier: item.tier,
            position: item.position
          })
        )
      );

      setSelectedTierList({
        ...selectedTierList,
        items: newItems
      });
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось переорганизовать элементы',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTierList = async (listId: string) => {
    try {
      await deleteTierList(listId);
      setTierLists(tierLists.filter(list => list.id !== listId));
      if (selectedTierList?.id === listId) {
        const remaining = tierLists.filter(list => list.id !== listId);
        if (remaining.length > 0) {
          const fullList = await getTierListById(remaining[0].id);
          setSelectedTierList(fullList);
        } else {
          setSelectedTierList(null);
        }
      }
      toast({
        title: 'Успех',
        description: 'Тир-лист удален',
      });
    } catch (error) {
      console.error('Error deleting tier list:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить тир-лист',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePublicStatus = async (listId: string, isPublic: boolean) => {
    try {
      await updateTierList(listId, { is_public: isPublic });
      setTierLists(tierLists.map(list =>
        list.id === listId ? { ...list, is_public: isPublic } : list
      ));
      if (selectedTierList?.id === listId) {
        setSelectedTierList({ ...selectedTierList, is_public: isPublic });
      }
      toast({
        title: 'Успех',
        description: isPublic ? 'Тир-лист опубликован' : 'Тир-лист скрыт',
      });
    } catch (error) {
      console.error('Error updating tier list:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить тир-лист',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Требуется авторизация</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Кастомные Топы</h1>
          <p className="text-muted-foreground">Создавайте и делитесь своими персональными тир-листами фильмов, сериалов и игр</p>
        </div>

        {/* Create new tier list dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mb-6" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Создать новый тир-лист
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новый тир-лист</DialogTitle>
              <DialogDescription>
                Дайте название вашему тир-листу и добавьте фильмы, сериалы и игры
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Название</label>
                <Input
                  value={newTierListTitle}
                  onChange={(e) => setNewTierListTitle(e.target.value)}
                  placeholder="Например: Мои любимые фильмы"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Описание (опционально)</label>
                <Textarea
                  value={newTierListDescription}
                  onChange={(e) => setNewTierListDescription(e.target.value)}
                  placeholder="Расскажите о вашем тир-листе"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <label htmlFor="isPublic" className="text-sm font-medium">
                  Сделать публичным
                </label>
              </div>
              <Button
                onClick={handleCreateTierList}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? 'Создание...' : 'Создать тир-лист'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tier lists list */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Мои тир-листы</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Загрузка...</p>
                ) : tierLists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Нет тир-листов</p>
                ) : (
                  <div className="space-y-2">
                    {tierLists.map((list) => (
                      <div
                        key={list.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedTierList?.id === list.id
                            ? 'border-primary bg-primary/10'
                            : 'border-muted hover:border-primary/50'
                        }`}
                        onClick={() => {
                          const fullList = tierLists.find(l => l.id === list.id);
                          if (fullList) setSelectedTierList(fullList);
                        }}
                      >
                        <p className="font-semibold text-sm truncate">{list.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {list.items?.length || 0} элементов
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main tier list editor */}
          <div className="lg:col-span-3">
            {selectedTierList ? (
              <div className="space-y-6">
                {/* Tier list info and controls */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedTierList.title}</CardTitle>
                        {selectedTierList.description && (
                          <CardDescription className="mt-2">
                            {selectedTierList.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleUpdatePublicStatus(
                              selectedTierList.id,
                              !selectedTierList.is_public
                            )
                          }
                        >
                          {selectedTierList.is_public ? (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Публичный
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              Приватный
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTierList(selectedTierList.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Tabs for search and tier list */}
                <Tabs defaultValue="tierlist" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tierlist">Тир-лист</TabsTrigger>
                    <TabsTrigger value="search">Добавить элементы</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tierlist" className="mt-6">
                    {selectedTierList.items && selectedTierList.items.length > 0 ? (
                      <TierListDisplay
                        items={selectedTierList.items}
                        onRemoveItem={handleRemoveItem}
                        onReorderItems={handleReorderItems}
                        isEditable={true}
                      />
                    ) : (
                      <Card>
                        <CardContent className="flex items-center justify-center py-12">
                          <p className="text-muted-foreground">
                            Перейдите на вкладку "Добавить элементы" чтобы начать
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="search" className="mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <TierListSearch onAddItem={handleAddItem} />
                      </CardContent>
                    </Card>

                    <div className="mt-6">
                      <PopularContent onAddItem={handleAddItem} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">
                    Создайте новый тир-лист чтобы начать
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierListsPage;
