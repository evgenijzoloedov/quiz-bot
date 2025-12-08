import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { filesApi } from '../api';
import type { FileInfo } from '../types';
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Modal,
} from '../components/ui';
import { formatDate, formatFileSize } from '../utils/formatters';
import {
	Upload,
	Trash2,
	Image,
	FileText,
	Download,
	Filter,
} from 'lucide-react';

export const FilesPage: React.FC = () => {
	const [filter, setFilter] = useState<'all' | 'image' | 'pdf'>('all');
	const [deletingFile, setDeletingFile] = useState<FileInfo | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery({
		queryKey: ['files', filter],
		queryFn: () =>
			filesApi.getAll({
				type: filter === 'all' ? undefined : filter,
				limit: 100,
			}),
	});

	const uploadMutation = useMutation({
		mutationFn: (file: File) => filesApi.upload(file),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (filename: string) => filesApi.delete(filename),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['files'] });
			setDeletingFile(null);
		},
	});

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			setIsUploading(true);
			try {
				for (const file of acceptedFiles) {
					await uploadMutation.mutateAsync(file);
				}
			} finally {
				setIsUploading(false);
			}
		},
		[uploadMutation]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
			'application/pdf': ['.pdf'],
		},
		multiple: false,
		maxSize: 20 * 1024 * 1024,
	});

	const handleDelete = () => {
		if (deletingFile) {
			deleteMutation.mutate(deletingFile.filename);
		}
	};

	return (
		<div className='space-y-6 animate-fadeIn'>
			{/* Header */}
			<div>
				<h1 className='text-2xl font-bold text-[#f0f0f5]'>Файлы</h1>
				<p className='text-[#606070] mt-1'>Управление загруженными файлами</p>
			</div>

			{/* Upload Zone */}
			<Card>
				<CardContent className='p-6'>
					<div
						{...getRootProps()}
						className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${
								isDragActive
									? 'border-accent-500 bg-accent-500/10'
									: 'border-[#2a2a3a] hover:border-[#3a3a4a]'
							}
            `}
					>
						<input {...getInputProps()} />
						<Upload
							className={`w-12 h-12 mx-auto mb-4 ${
								isDragActive ? 'text-accent-400' : 'text-[#606070]'
							}`}
						/>
						<p className='text-[#a0a0b0] mb-2'>
							{isDragActive
								? 'Отпустите файлы здесь'
								: 'Перетащите файлы или кликните для выбора'}
						</p>
						<p className='text-sm text-[#606070]'>
							Поддерживаются: JPG, PNG, WEBP, GIF, PDF (макс. 20MB)
						</p>
						{isUploading && (
							<div className='mt-4 flex items-center justify-center gap-2 text-accent-400'>
								<div className='w-4 h-4 border-2 border-accent-500 border-t-transparent rounded-full animate-spin' />
								Загрузка...
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Files List */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<CardTitle>Загруженные файлы</CardTitle>
						<div className='flex items-center gap-2'>
							<Filter className='w-4 h-4 text-[#606070]' />
							<div className='flex rounded-lg overflow-hidden border border-[#2a2a3a]'>
								{(['all', 'image', 'pdf'] as const).map((f) => (
									<button
										key={f}
										onClick={() => setFilter(f)}
										className={`px-3 py-1.5 text-sm transition-colors ${
											filter === f
												? 'bg-accent-500 text-white'
												: 'bg-[#1a1a24] text-[#606070] hover:text-[#a0a0b0]'
										}`}
									>
										{f === 'all' ? 'Все' : f === 'image' ? 'Картинки' : 'PDF'}
									</button>
								))}
							</div>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='flex items-center justify-center py-12'>
							<div className='w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin' />
						</div>
					) : data?.data && data.data.length > 0 ? (
						<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
							{data.data.map((file) => (
								<div
									key={file.filename}
									className='group relative rounded-lg overflow-hidden bg-[#0a0a0f] border border-[#1a1a24] hover:border-[#2a2a3a] transition-colors'
								>
									{/* Preview */}
									<div className='aspect-square flex items-center justify-center bg-[#0f0f14]'>
										{file.type === 'image' ? (
											<img
												src={file.url}
												alt={file.filename}
												className='w-full h-full object-cover'
											/>
										) : (
											<FileText className='w-12 h-12 text-[#404050]' />
										)}
									</div>

									{/* Info */}
									<div className='p-3'>
										<p
											className='text-sm text-[#f0f0f5] truncate'
											title={file.filename}
										>
											{file.filename}
										</p>
										<div className='flex items-center justify-between mt-1'>
											<span className='text-xs text-[#606070]'>
												{formatFileSize(file.size)}
											</span>
											<span className='text-xs text-[#606070]'>
												{file.type === 'image' ? (
													<Image className='w-3 h-3 inline' />
												) : (
													<FileText className='w-3 h-3 inline' />
												)}
											</span>
										</div>
									</div>

									{/* Overlay Actions */}
									<div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
										<a
											href={file.url}
											target='_blank'
											rel='noopener noreferrer'
											className='p-2 rounded-lg bg-[#1a1a24] text-[#f0f0f5] hover:bg-[#242430] transition-colors'
											aria-label='Скачать'
										>
											<Download className='w-5 h-5' />
										</a>
										<button
											onClick={() => setDeletingFile(file)}
											className='p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors'
											aria-label='Удалить'
										>
											<Trash2 className='w-5 h-5' />
										</button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className='text-center py-12'>
							<p className='text-[#606070]'>Нет загруженных файлов</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation */}
			<Modal
				isOpen={!!deletingFile}
				onClose={() => setDeletingFile(null)}
				title='Удаление файла'
				size='sm'
			>
				<div className='space-y-6'>
					<p className='text-[#a0a0b0]'>
						Вы уверены, что хотите удалить файл{' '}
						<span className='text-[#f0f0f5] font-medium break-all'>
							{deletingFile?.filename}
						</span>
						?
					</p>
					<div className='flex gap-3 justify-end'>
						<Button variant='secondary' onClick={() => setDeletingFile(null)}>
							Отмена
						</Button>
						<Button
							variant='danger'
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
