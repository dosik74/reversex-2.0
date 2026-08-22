import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { createRecommendation } from '@/services/recommendationService';
import { FileIcon, Plus, X } from 'lucide-react';
import './RecommendationCreate.css';

interface RecommendationCreateProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RecommendationCreate({ onSuccess, onCancel }: RecommendationCreateProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submit clicked');
    console.log('Title:', title);
    console.log('Content:', content);
    console.log('Files:', files);
    
    if (!title.trim() || !content.trim()) {
      setError('Пожалуйста, заполните название и описание');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Starting createRecommendation...');
      await createRecommendation(title, content, files.length > 0 ? files : undefined);
      console.log('createRecommendation completed successfully');

      // Reset form
      setTitle('');
      setContent('');
      setFiles([]);

      onSuccess?.();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании рекомендации';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommendation-create-container">
      <div className="recommendation-create-card">
        <h2 className="recommendation-create-title">Поделиться рекомендацией</h2>
        
        <form onSubmit={handleSubmit} className="recommendation-create-form">
          {error && (
            <div className="recommendation-create-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Заголовок
            </label>
            <Input
              id="title"
              placeholder="Например: Лучший фильм года"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content" className="form-label">
              Описание рекомендации
            </label>
            <Textarea
              id="content"
              placeholder="Расскажите, почему вам нравится это..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              className="form-textarea"
              rows={5}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Добавить изображения или рисунки
            </label>
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="file-upload-button"
              disabled={loading}
            >
              <Plus size={20} />
              <span>Добавить файл</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={loading}
            />

            {files.length > 0 && (
              <div className="file-list">
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <FileIcon size={16} />
                    <span className="file-name">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="file-remove-button"
                      disabled={loading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-cancel"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim()}
              className="btn-submit"
            >
              {loading ? 'Загрузка...' : 'Поделиться'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
