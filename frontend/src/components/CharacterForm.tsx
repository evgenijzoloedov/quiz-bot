import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { charactersApi } from '../api';
import type { Character } from '../types';
import { Button, Input, TextArea, FileUpload } from './ui';

interface CharacterFormData {
  name: string;
  description: string;
}

interface CharacterFormProps {
  character?: Character;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CharacterForm: React.FC<CharacterFormProps> = ({
  character,
  onSuccess,
  onCancel,
}) => {
  const [successMeme, setSuccessMeme] = useState<File | null>(null);
  const [failMeme, setFailMeme] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CharacterFormData>({
    defaultValues: {
      name: character?.name || '',
      description: character?.description || '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => charactersApi.create(formData),
    onSuccess,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      charactersApi.update(id, formData),
    onSuccess,
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const handleFormSubmit = (data: CharacterFormData) => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description || '');

    if (successMeme) formData.append('successMeme', successMeme);
    if (failMeme) formData.append('failMeme', failMeme);
    if (pdfFile) formData.append('pdfFile', pdfFile);

    if (character) {
      updateMutation.mutate({ id: character._id, formData });
    } else {
      // Validate required files for new character
      if (!successMeme || !failMeme || !pdfFile) {
        alert('Все файлы обязательны для нового персонажа');
        return;
      }
      createMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Input
        label="Имя персонажа"
        placeholder="Введите имя"
        {...register('name', { 
          required: 'Имя обязательно',
          maxLength: { value: 50, message: 'Максимум 50 символов' }
        })}
        error={errors.name?.message}
      />

      <TextArea
        label="Описание"
        placeholder="Описание персонажа (опционально)"
        rows={3}
        {...register('description', {
          maxLength: { value: 500, message: 'Максимум 500 символов' }
        })}
        error={errors.description?.message}
      />

      <FileUpload
        label="Success Meme (JPG, PNG, MP4, MOV, WEBM)"
        accept={{ 
          'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
          'video/*': ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v', '.3gp', '.flv', '.wmv']
        }}
        value={successMeme}
        previewUrl={character?.successMeme}
        onChange={setSuccessMeme}
        helperText="Изображение или видео при успешном прохождении"
      />

      <FileUpload
        label="Fail Meme (JPG, PNG)"
        accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
        value={failMeme}
        previewUrl={character?.failMeme}
        onChange={setFailMeme}
        helperText="Изображение при неправильном ответе"
      />

      <FileUpload
        label="PDF Файл"
        accept={{ 'application/pdf': ['.pdf'] }}
        maxSize={20 * 1024 * 1024}
        value={pdfFile}
        onChange={setPdfFile}
        helperText="Документ для отправки при успешном прохождении"
      />

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
          {character ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
};

