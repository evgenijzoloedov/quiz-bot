import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '../api';
import type { Question } from '../types';
import { Button, Card, CardContent, CardHeader, CardTitle, Modal } from '../components/ui';
import { QuestionForm } from '../components/QuestionForm';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  Image,
  CheckSquare,
  Square
} from 'lucide-react';

export const QuizBuilderPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);

  const queryClient = useQueryClient();

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => questionsApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => questionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setDeletingQuestion(null);
    },
  });

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false);
    setEditingQuestion(null);
    queryClient.invalidateQueries({ queryKey: ['questions'] });
  };

  const handleDelete = () => {
    if (deletingQuestion) {
      deleteMutation.mutate(deletingQuestion._id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Вопросы</h1>
          <p className="text-[#606070] mt-1">Создание и редактирование вопросов для общего квиза</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить вопрос
        </Button>
      </div>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle>Все вопросы</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {questionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : questionsData?.data && questionsData.data.length > 0 ? (
            <div className="divide-y divide-[#1a1a24]">
              {questionsData.data.map((question, index) => (
                <div
                  key={question._id}
                  className="flex items-start gap-4 p-6 hover:bg-[#0f0f14] transition-colors"
                >
                  {/* Drag Handle */}
                  <div className="mt-1 cursor-move text-[#404050] hover:text-[#606070]">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Order Number */}
                  <div className="w-8 h-8 rounded-lg bg-[#1a1a24] flex items-center justify-center text-sm font-medium text-[#a0a0b0]">
                    {index + 1}
                  </div>

                  {/* Question Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f0f0f5] mb-2 line-clamp-2">
                      {question.questionText}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-[#606070]">
                      <span className="flex items-center gap-1.5">
                        {question.type === 'single' ? (
                          <>
                            <Square className="w-4 h-4" />
                            Один ответ
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-4 h-4" />
                            Несколько ответов
                          </>
                        )}
                      </span>
                      <span>{question.answers.length} вариантов</span>
                      {question.image && (
                        <span className="flex items-center gap-1.5">
                          <Image className="w-4 h-4" />
                          Картинка
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingQuestion(question)}
                      aria-label="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingQuestion(question)}
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
              <p className="text-[#606070] mb-4">Вопросы пока не созданы</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Добавить первый вопрос
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Новый вопрос"
        size="lg"
      >
        <QuestionForm
          onSuccess={handleFormSuccess}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingQuestion}
        onClose={() => setEditingQuestion(null)}
        title="Редактирование вопроса"
        size="lg"
      >
        {editingQuestion && (
          <QuestionForm
            question={editingQuestion}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditingQuestion(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingQuestion}
        onClose={() => setDeletingQuestion(null)}
        title="Удаление вопроса"
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-[#a0a0b0]">
            Вы уверены, что хотите удалить этот вопрос? Это действие нельзя отменить.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeletingQuestion(null)}>
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

