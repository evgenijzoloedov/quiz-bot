import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quizApi, questionsApi } from '../api';
import type { Quiz, Question } from '../types';
import { Button, Card, CardContent, Input, Modal, FileUpload } from '../components/ui';
import { 
  Video, 
  Plus, 
  Edit, 
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const QuizPage: React.FC = () => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const queryClient = useQueryClient();

  const { data: quizData, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz'],
    queryFn: () => quizApi.getActive(),
  });

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ['questions'],
    queryFn: () => questionsApi.getAll(),
  });

  const updateQuizMutation = useMutation({
    mutationFn: (formData: FormData) => quizApi.update(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
      setIsVideoModalOpen(false);
      setVideoFile(null);
    },
  });

  const handleVideoUpload = () => {
    if (!videoFile) return;

    const formData = new FormData();
    formData.append('successVideo', videoFile);
    
    updateQuizMutation.mutate(formData);
  };

  const handleAddQuestion = (questionId: string) => {
    if (!quizData?.data) return;

    const currentQuestionIds = quizData.data.questions?.map(q => q._id) || [];
    if (currentQuestionIds.includes(questionId)) return;

    const formData = new FormData();
    formData.append('questionIds', JSON.stringify([...currentQuestionIds, questionId]));
    
    updateQuizMutation.mutate(formData);
  };

  const handleRemoveQuestion = (questionId: string) => {
    if (!quizData?.data) return;

    const currentQuestionIds = quizData.data.questions?.map(q => q._id) || [];
    const newQuestionIds = currentQuestionIds.filter(id => id !== questionId);

    const formData = new FormData();
    formData.append('questionIds', JSON.stringify(newQuestionIds));
    
    updateQuizMutation.mutate(formData);
  };

  const handleReorderQuestion = (questionId: string, direction: 'up' | 'down') => {
    if (!quizData?.data?.questions) return;

    const questions = [...quizData.data.questions];
    const currentIndex = questions.findIndex(q => q._id === questionId);
    
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === questions.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [questions[currentIndex], questions[newIndex]] = [questions[newIndex], questions[currentIndex]];

    const formData = new FormData();
    formData.append('questionIds', JSON.stringify(questions.map(q => q._id)));
    
    updateQuizMutation.mutate(formData);
  };

  const quizQuestions = quizData?.data?.questions || [];
  const availableQuestions = questionsData?.data?.filter(
    q => !quizQuestions.some(qq => qq._id === q._id)
  ) || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Квиз</h1>
          <p className="text-[#606070] mt-1">Управление общим квизом</p>
        </div>
        <Button onClick={() => setIsVideoModalOpen(true)}>
          <Video className="w-4 h-4 mr-2" />
          Загрузить видео
        </Button>
      </div>

      {/* Video Section */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">Видео при успешном прохождении</h2>
          {quizLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : quizData?.data?.successVideo ? (
            <div className="space-y-4">
              <video
                src={quizData.data.successVideo}
                controls
                className="w-full max-w-md rounded-lg"
              />
              <Button
                variant="secondary"
                onClick={() => setIsVideoModalOpen(true)}
              >
                Заменить видео
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-[#2a2a3a] rounded-lg">
              <p className="text-[#606070] mb-4">Видео не загружено</p>
              <Button onClick={() => setIsVideoModalOpen(true)}>
                Загрузить видео
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">
            Вопросы квиза ({quizQuestions.length})
          </h2>

          {questionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Questions */}
              {quizQuestions.length > 0 ? (
                <div className="space-y-2">
                  {quizQuestions.map((question, index) => (
                    <div
                      key={question._id}
                      className="flex items-center justify-between p-4 bg-[#0f0f14] rounded-lg border border-[#2a2a3a]"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-sm text-[#606070] w-8">
                          {index + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="text-[#f0f0f5] font-medium">
                            {question.questionText}
                          </p>
                          <p className="text-sm text-[#606070] mt-1">
                            Тип: {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderQuestion(question._id, 'up')}
                          disabled={index === 0}
                          aria-label="Вверх"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorderQuestion(question._id, 'down')}
                          disabled={index === quizQuestions.length - 1}
                          aria-label="Вниз"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveQuestion(question._id)}
                          className="text-red-400 hover:text-red-300"
                          aria-label="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-[#2a2a3a] rounded-lg">
                  <p className="text-[#606070]">Вопросы не добавлены</p>
                </div>
              )}

              {/* Available Questions */}
              {availableQuestions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#2a2a3a]">
                  <h3 className="text-md font-semibold text-[#f0f0f5] mb-4">
                    Доступные вопросы
                  </h3>
                  <div className="space-y-2">
                    {availableQuestions.map((question) => (
                      <div
                        key={question._id}
                        className="flex items-center justify-between p-4 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]"
                      >
                        <div className="flex-1">
                          <p className="text-[#f0f0f5]">{question.questionText}</p>
                          <p className="text-sm text-[#606070] mt-1">
                            Тип: {question.type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddQuestion(question._id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Добавить
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Upload Modal */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setVideoFile(null);
        }}
        title="Загрузить видео"
        size="md"
      >
        <div className="space-y-6">
          <FileUpload
            label="Видео для успешного прохождения"
            accept={{ 'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv'] }}
            value={videoFile}
            onChange={setVideoFile}
            helperText="Видео будет отправлено всем пользователям при успешном прохождении квиза"
            maxSize={100 * 1024 * 1024}
          />

          {updateQuizMutation.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {(updateQuizMutation.error as Error).message || 'Произошла ошибка'}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-[#2a2a3a]">
            <Button
              variant="secondary"
              onClick={() => {
                setIsVideoModalOpen(false);
                setVideoFile(null);
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleVideoUpload}
              isLoading={updateQuizMutation.isPending}
              disabled={!videoFile}
            >
              Загрузить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

