import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { namesApi } from '../api';
import type { Name } from '../types';
import { Button, Card, CardContent, Input, Modal, FileUpload } from '../components/ui';
import { formatDate } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  FileText
} from 'lucide-react';

interface NameFormProps {
  name?: Name;
  onSuccess: () => void;
  onCancel: () => void;
}

const NameForm: React.FC<NameFormProps> = ({ name, onSuccess, onCancel }) => {
  const [formName, setFormName] = useState(name?.name || '');
  const [isActive, setIsActive] = useState(name?.isActive ?? true);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Reset form when name changes (for edit mode)
  useEffect(() => {
    if (name) {
      setFormName(name.name || '');
      setIsActive(name.isActive ?? true);
      setPdfFile(null); // Reset file selection when editing
    } else {
      setFormName('');
      setIsActive(true);
      setPdfFile(null);
    }
  }, [name]);

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => namesApi.create(formData),
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      namesApi.update(id, formData),
    onSuccess,
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', formName.trim());
    formData.append('isActive', String(isActive));
    
    if (pdfFile) {
      formData.append('pdfFile', pdfFile);
    }
    
    if (name) {
      updateMutation.mutate({ id: name._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-[#a0a0b0] mb-2">
          Имя
        </label>
        <Input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="Введите имя"
          required
          maxLength={100}
        />
      </div>

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

      <div>
        <FileUpload
          label="PDF файл"
          accept={{ 'application/pdf': ['.pdf'] }}
          value={pdfFile}
          previewUrl={name?.pdfFile}
          onChange={setPdfFile}
          helperText="PDF файл для отправки пользователю после успешного прохождения квиза"
          maxSize={20 * 1024 * 1024}
        />
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
          {name ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
};

export const NamesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingName, setEditingName] = useState<Name | null>(null);
  const [deletingName, setDeletingName] = useState<Name | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['names', { page, search }],
    queryFn: () => namesApi.getAll({ page, limit: 10, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => namesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['names'] });
      setDeletingName(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDelete = () => {
    if (deletingName) {
      deleteMutation.mutate(deletingName._id);
    }
  };

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingName(null);
    queryClient.invalidateQueries({ queryKey: ['names'] });
  };

  const handleFormCancel = () => {
    setIsCreateModalOpen(false);
    setEditingName(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Имена</h1>
          <p className="text-[#606070] mt-1">Управление списком имен для выбора в квизе</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить имя
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#606070]" />
          <Input
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data?.data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2a2a3a]">
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#606070]">Имя</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#606070]">Статус</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#606070]">Создан</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-[#606070]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((nameDoc) => (
                    <tr 
                      key={nameDoc._id} 
                      className="border-b border-[#1a1a24] hover:bg-[#0f0f14] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-[#f0f0f5]">{nameDoc.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        {nameDoc.pdfFile ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <FileText className="w-3 h-3" />
                            Есть PDF
                          </span>
                        ) : (
                          <span className="text-xs text-[#606070]">Нет PDF</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {nameDoc.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            <CheckCircle className="w-3 h-3" />
                            Активен
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <XCircle className="w-3 h-3" />
                            Неактивен
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#606070]">
                        {formatDate(nameDoc.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingName(nameDoc)}
                            aria-label="Редактировать"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingName(nameDoc)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            aria-label="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-[#606070]">Имена не найдены</p>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-[#2a2a3a] flex items-center justify-between">
            <p className="text-sm text-[#606070]">
              Страница {data.pagination.page} из {data.pagination.pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Назад
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= (data.pagination.pages || 1)}
              >
                Далее
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleFormCancel}
        title="Новое имя"
        size="md"
      >
        <NameForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingName}
        onClose={handleFormCancel}
        title="Редактирование имени"
        size="md"
      >
        {editingName && (
          <NameForm
            name={editingName}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingName}
        onClose={() => setDeletingName(null)}
        title="Удаление имени"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-[#a0a0b0]">
            Вы уверены, что хотите удалить имя{' '}
            <span className="text-[#f0f0f5] font-medium">
              {deletingName?.name}
            </span>
            ? Это действие нельзя отменить.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeletingName(null)}>
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

