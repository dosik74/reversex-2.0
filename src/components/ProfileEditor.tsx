import { useState } from "react";
import supabase from "@/utils/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Loader2, Palette, Sparkles } from "lucide-react";

interface ProfileEditorProps {
  profile: any;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ProfileEditor = ({ profile, open, onClose, onUpdate }: ProfileEditorProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<'avatar' | 'background' | null>(null);
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || '',
    background_gif_url: profile.background_gif_url || '',
    profile_color: profile.profile_color || '#3b82f6',
    profile_accent: profile.profile_accent || '#8b5cf6',
    status: profile.status || 'offline',
    location: profile.location || '',
  });

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = type === 'avatar' ? 5 : 10;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Файл слишком большой. Максимум ${maxSize}MB`);
      return;
    }

    try {
      setUploading(type);
      const bucket = type === 'avatar' ? 'avatars' : 'backgrounds';
      const url = await uploadFile(file, bucket);

      setFormData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatar_url' : 'background_gif_url']: url
      }));

      toast.success('Файл загружен успешно');
    } catch (error) {
      toast.error('Ошибка при загрузке файла');
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Профиль обновлен');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать профиль</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name">Имя профиля</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Твое имя"
              />
            </div>

            <div>
              <Label htmlFor="location">Местоположение</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Город, страна"
              />
            </div>

            <div>
              <Label htmlFor="bio">О себе</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Расскажи о себе, добавь смайлики или ASCII-арт..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="profile_color">Основной цвет</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="color"
                    id="profile_color"
                    value={formData.profile_color}
                    onChange={(e) => setFormData({ ...formData, profile_color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.profile_color}
                    onChange={(e) => setFormData({ ...formData, profile_color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="profile_accent">Цвет акцента</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="color"
                    id="profile_accent"
                    value={formData.profile_accent}
                    onChange={(e) => setFormData({ ...formData, profile_accent: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <Input
                    value={formData.profile_accent}
                    onChange={(e) => setFormData({ ...formData, profile_accent: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Статус</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="offline">Оффлайн</option>
                <option value="online">Онлайн</option>
                <option value="idle">Неактивен</option>
                <option value="dnd">Не беспокоить</option>
              </select>
            </div>

            <div>
              <Label>Аватар</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.avatar_url && (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <div>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'avatar')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                    disabled={uploading === 'avatar'}
                  >
                    {uploading === 'avatar' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Загрузить аватар
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Максимум 5MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label>Фон профиля</Label>
              <div className="mt-2">
                {formData.background_gif_url && (
                  <div className="mb-4 h-32 rounded-lg overflow-hidden">
                    <img
                      src={formData.background_gif_url}
                      alt="Background preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="background-upload"
                    accept="image/gif,image/webp,image/jpeg,image/png"
                    onChange={(e) => handleFileUpload(e, 'background')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('background-upload')?.click()}
                    disabled={uploading === 'background'}
                  >
                    {uploading === 'background' ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Загрузить фон
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">Максимум 10MB, GIF рекомендуется</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditor;