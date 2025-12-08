import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { questionsApi } from '../api';
import type { Question, Answer } from '../types';
import { Button, Input, TextArea, Select, Checkbox, FileUpload } from './ui';
import { Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface QuestionFormData {
  questionText: string;
  type: 'single' | 'multiple';
  answers: Answer[];
}

interface QuestionFormProps {
  question?: Question;
  onSuccess: () => void;
  onCancel: () => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  question,
  onSuccess,
  onCancel,
}) => {
  const [image, setImage] = useState<File | null>(null);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<QuestionFormData>({
    defaultValues: {
      questionText: question?.questionText || '',
      type: question?.type || 'single',
      answers: question?.answers || [
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'answers',
  });

  const watchType = watch('type');

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => questionsApi.create(formData),
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      questionsApi.update(id, formData),
    onSuccess,
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const handleFormSubmit = (data: QuestionFormData) => {
    // Validate at least one correct answer
    const hasCorrectAnswer = data.answers.some(a => a.isCorrect);
    if (!hasCorrectAnswer) {
      alert('Выберите хотя бы один правильный ответ');
      return;
    }

    const formData = new FormData();
    formData.append('questionText', data.questionText);
    formData.append('type', data.type);
    formData.append('answers', JSON.stringify(data.answers));

    if (image) {
      formData.append('image', image);
    } else if (question?.image && !image) {
      // If image was removed, send flag to delete it
      formData.append('removeImage', 'true');
    }

    if (question) {
      updateMutation.mutate({ id: question._id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddAnswer = () => {
    if (fields.length < 5) {
      append({ id: uuidv4(), text: '', isCorrect: false });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <TextArea
        label="Текст вопроса"
        placeholder="Введите текст вопроса"
        rows={3}
        {...register('questionText', {
          required: 'Текст вопроса обязателен',
          maxLength: { value: 500, message: 'Максимум 500 символов' },
        })}
        error={errors.questionText?.message}
      />

      <Select
        label="Тип вопроса"
        {...register('type')}
        options={[
          { value: 'single', label: 'Один правильный ответ' },
          { value: 'multiple', label: 'Несколько правильных ответов' },
        ]}
      />

      <FileUpload
        label="Изображение или видео (опционально)"
        accept={{
          'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
          'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp', '.flv', '.wmv']
        }}
        value={image}
        previewUrl={question?.image || undefined}
        onChange={setImage}
        helperText="Показывается вместе с вопросом"
        maxSize={20 * 1024 * 1024}
      />

      {/* Answers */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#a0a0b0]">
            Варианты ответов
          </label>
          <span className="text-xs text-[#606070]">
            {watchType === 'single' ? 'Выберите один правильный' : 'Выберите все правильные'}
          </span>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a0f] border border-[#1a1a24]"
            >
              <Controller
                name={`answers.${index}.isCorrect`}
                control={control}
                render={({ field: checkboxField }) => (
                  <Checkbox
                    checked={checkboxField.value}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      // For single choice, uncheck others when checking this one
                      if (watchType === 'single' && isChecked) {
                        fields.forEach((_, i) => {
                          if (i !== index) {
                            setValue(`answers.${i}.isCorrect`, false);
                          }
                        });
                      }
                      checkboxField.onChange(isChecked);
                    }}
                    aria-label={`Ответ ${index + 1} правильный`}
                  />
                )}
              />
              <input
                type="hidden"
                {...register(`answers.${index}.id`)}
                value={field.id}
              />
              <Input
                placeholder={`Вариант ответа ${index + 1}`}
                className="flex-1"
                {...register(`answers.${index}.text`, {
                  required: 'Текст ответа обязателен',
                  maxLength: { value: 100, message: 'Максимум 100 символов' },
                })}
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-red-400 hover:text-red-300"
                  aria-label="Удалить вариант"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {fields.length < 5 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddAnswer}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить вариант
          </Button>
        )}
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
          {question ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
};

