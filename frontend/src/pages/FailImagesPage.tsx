import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { failImagesApi } from '../api';
import type { FailImage } from '../types';
import { Button, Card, CardContent, Modal, FileUpload } from '../components/ui';
import { formatDate } from '../utils/formatters';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  GripVertical
} from 'lucide-react';

interface FailImageFormProps {
  failImage?: FailImage;
  onSuccess: () => void;
  onCancel: () => void;
}

const FailImageForm: React.FC<FailImageFormProps> = ({ failImage, onSuccess, onCancel }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(failImage?.isActive ?? true);

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => failImagesApi.create(formData),
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive: boolean } }) =>
      failImagesApi.update(id, data),
    onSuccess,
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!failImage) {
      // Create new
      if (!imageFile) {
        alert('Пожалуйста, выберите изображение');
        return;
      }
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('isActive', String(isActive));
      
      createMutation.mutate(formData);
    } else {
      // Update existing
      updateMutation.mutate({ id: failImage._id, data: { isActive } });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!failImage && (
        <div>
          <FileUpload
            label="Изображение"
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] }}
            value={imageFile}
            onChange={setImageFile}
            helperText="Изображение для отправки при неправильном ответе"
            maxSize={20 * 1024 * 1024}
            required
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 rounded border-[#2a2a3a] bg-[#0f0f14] text-accent-500 focus:ring-accent-500"
        />
        <label htmlFor="isActive" className="text-sm text-[#a0a0b0]">
          Активно
        </label>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {(error as Error).message || 'Произошла ошибка'}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4 border-t border-[#2a2a3a]">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {failImage ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
};

export const FailImagesPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<FailImage | null>(null);
  const [deletingImage, setDeletingImage] = useState<FailImage | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['failImages'],
    queryFn: () => failImagesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => failImagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['failImages'] });
      setDeletingImage(null);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ id, newOrder }: { id: string; newOrder: number }) =>
      failImagesApi.reorder(id, newOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['failImages'] });
    },
  });

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingImage(null);
    queryClient.invalidateQueries({ queryKey: ['failImages'] });
  };

  const handleDelete = () => {
    if (deletingImage) {
      deleteMutation.mutate(deletingImage._id);
    }
  };

  const handleMoveUp = (image: FailImage, index: number) => {
    if (index > 0 && data?.data) {
      const prevImage = data.data[index - 1];
      reorderMutation.mutate({ id: image._id, newOrder: prevImage.order });
    }
  };

  const handleMoveDown = (image: FailImage, index: number) => {
    if (data?.data && index < data.data.length - 1) {
      const nextImage = data.data[index + 1];
      reorderMutation.mutate({ id: image._id, newOrder: nextImage.order });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Картинки для неправильных ответов</h1>
          <p className="text-[#606070] mt-1">Управление картинками, которые отправляются при неправильном ответе (по кругу)</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить картинку
        </Button>
      </div>

      {/* Images List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="divide-y divide-[#1a1a24]">
              {data.data.map((image, index) => (
                <div
                  key={image._id}
                  className="flex items-center gap-4 p-6 hover:bg-[#0f0f14] transition-colors"
                >
                  {/* Drag Handle */}
                  <div className="text-[#404050] hover:text-[#606070]">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Order Number */}
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a24] flex items-center justify-center text-sm font-medium text-[#a0a0b0]">
                    {index + 1}
                  </div>

                  {/* Image Preview */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#1a1a24] flex items-center justify-center">
                    {image.imageUrl ? (
                      <img
                        src={image.imageUrl}
                        alt={`Fail image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#606070]" />
                    )}
                  </div>

                  {/* Image Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#f0f0f5] mb-1 truncate">
                      {image.filename}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-[#606070]">
                      <span>Порядок: {image.order}</span>
                      {image.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Активна
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          Неактивна
                        </span>
                      )}
                      <span className="text-xs">
                        {formatDate(image.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(image, index)}
                      disabled={index === 0 || reorderMutation.isPending}
                      aria-label="Переместить вверх"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(image, index)}
                      disabled={index === (data.data.length - 1) || reorderMutation.isPending}
                      aria-label="Переместить вниз"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingImage(image)}
                      aria-label="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingImage(image)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      aria-label="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#606070] mb-4">Картинки не найдены</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить первую картинку
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Новая картинка"
        size="md"
      >
        <FailImageForm onSuccess={handleFormSuccess} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingImage}
        onClose={() => setEditingImage(null)}
        title="Редактирование картинки"
        size="md"
      >
        {editingImage && (
          <FailImageForm
            failImage={editingImage}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingImage(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingImage}
        onClose={() => setDeletingImage(null)}
        title="Удаление картинки"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-[#a0a0b0]">
            Вы уверены, что хотите удалить эту картинку? Это действие нельзя отменить.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeletingImage(null)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

