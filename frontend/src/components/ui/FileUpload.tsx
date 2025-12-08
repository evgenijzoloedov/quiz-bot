import React, { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../utils/cn';
import { Upload, X, FileImage, FileText, FileVideo } from 'lucide-react';

interface FileUploadProps {
	label?: string;
	accept?: Record<string, string[]>;
	maxSize?: number;
	value?: File | null;
	previewUrl?: string;
	onChange: (file: File | null) => void;
	error?: string;
	helperText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
	label,
	accept = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
	maxSize = 5 * 1024 * 1024,
	value,
	previewUrl,
	onChange,
	error,
	helperText,
}) => {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			if (acceptedFiles.length > 0) {
				onChange(acceptedFiles[0]);
			}
		},
		[onChange]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept,
		maxSize,
		multiple: false,
		noClick: true, // Disable default click, we'll handle it manually
		noKeyboard: false,
	});

	const handleFileSelect = (e?: React.MouseEvent) => {
		if (e) {
			e.stopPropagation();
			e.preventDefault();
		}
		// Try to click the input via ref first
		if (fileInputRef.current) {
			fileInputRef.current.click();
		} else {
			// Fallback: find the input in the DOM
			const dropzone = e?.currentTarget?.closest(
				'div[class*="border-dashed"]'
			) as HTMLElement;
			if (dropzone) {
				const inputs = dropzone.querySelectorAll('input[type="file"]');
				// Click the second input (our custom one)
				if (inputs.length > 1) {
					(inputs[1] as HTMLInputElement).click();
				}
			}
		}
	};

	// Handle file change from our custom input
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			onChange(files[0]);
		}
	};

	// Build accept string for input
	const acceptString = React.useMemo(() => {
		return Object.entries(accept)
			.flatMap(([mime, exts]) => {
				if (mime.includes('*')) {
					// For wildcard mime types, use extensions
					return exts.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`));
				}
				// For specific mime types, use both mime and extensions
				return [
					mime,
					...exts.map((ext) => (ext.startsWith('.') ? ext : `.${ext}`)),
				];
			})
			.join(',');
	}, [accept]);

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		e.preventDefault();
		onChange(null);
	};

	const isPdf =
		value?.type === 'application/pdf' ||
		(accept['application/pdf'] && !value?.type?.startsWith('image/') && !value?.type?.startsWith('video/'));

	const isVideo = value?.type?.startsWith('video/') || 
		(previewUrl && /\.(mp4|mov|webm|avi|mkv|m4v|3gp|flv|wmv)$/i.test(previewUrl));

	const displayUrl = value ? URL.createObjectURL(value) : previewUrl;

	return (
		<div className='w-full'>
			{label && (
				<label className='block text-sm font-medium text-[#a0a0b0] mb-2'>
					{label}
				</label>
			)}

			<div
				{...getRootProps()}
				onClick={(e) => {
					// If clicking on a button, don't open file dialog
					const target = e.target as HTMLElement;
					if (target.closest('button') || target.tagName === 'BUTTON') {
						return;
					}
					// If no file selected, open file dialog on click
					if (!value) {
						e.stopPropagation();
						handleFileSelect();
					}
				}}
				className={cn(
					'relative border-2 border-dashed rounded-lg p-6 cursor-pointer',
					'transition-all duration-200',
					isDragActive
						? 'border-accent-500 bg-accent-500/10'
						: 'border-[#2a2a3a] hover:border-[#3a3a4a]',
					error && 'border-red-500'
				)}
			>
				{/* Input for drag and drop */}
				<input {...getInputProps()} style={{ display: 'none' }} />

				{/* Separate input for clicking */}
				<input
					ref={fileInputRef}
					type='file'
					accept={acceptString}
					onChange={handleFileChange}
					style={{ display: 'none' }}
					aria-label={label || 'Загрузить файл'}
				/>

				{displayUrl && !isPdf ? (
					<div className='relative'>
						{isVideo ? (
							<video
								src={displayUrl}
								className='w-full h-40 object-cover rounded-lg'
								controls
								preload='metadata'
							/>
						) : (
							<img
								src={displayUrl}
								alt='Preview'
								className='w-full h-40 object-cover rounded-lg'
							/>
						)}
						<div className='absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-lg'>
							<button
								type='button'
								onClick={(e) => {
									e.stopPropagation();
									handleFileSelect();
								}}
								className='px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-400 transition-colors'
							>
								Заменить
							</button>
							<button
								type='button'
								onClick={handleRemove}
								className='px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors'
								aria-label='Удалить'
							>
								Удалить
							</button>
						</div>
					</div>
				) : value ? (
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							{isPdf ? (
								<FileText className='w-10 h-10 text-accent-400' />
							) : isVideo ? (
								<FileVideo className='w-10 h-10 text-accent-400' />
							) : (
								<FileImage className='w-10 h-10 text-accent-400' />
							)}
							<div>
								<p className='text-[#f0f0f5] font-medium truncate max-w-xs'>
									{value.name}
								</p>
								<p className='text-sm text-[#606070]'>
									{(value.size / 1024 / 1024).toFixed(2)} MB
								</p>
							</div>
						</div>
						<div className='flex items-center gap-2'>
							<button
								type='button'
								onClick={(e) => {
									e.stopPropagation();
									handleFileSelect();
								}}
								className='px-3 py-1.5 text-sm bg-accent-500 text-white rounded-lg hover:bg-accent-400 transition-colors'
							>
								Заменить
							</button>
							<button
								type='button'
								onClick={handleRemove}
								className='p-2 text-red-400 hover:text-red-300 transition-colors'
								aria-label='Удалить'
							>
								<X className='w-5 h-5' />
							</button>
						</div>
					</div>
				) : (
					<div className='flex flex-col items-center gap-3 text-[#606070]'>
						<Upload className='w-10 h-10' />
						<div className='text-center'>
							<p className='text-[#a0a0b0] mb-2'>
								{isDragActive
									? 'Отпустите файл здесь'
									: 'Перетащите файл или кликните для выбора'}
							</p>
							<button
								type='button'
								onClick={(e) => {
									e.stopPropagation();
									handleFileSelect();
								}}
								className='px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-400 transition-colors text-sm'
							>
								Выбрать файл
							</button>
							<p className='text-sm mt-2'>
								Максимум {(maxSize / 1024 / 1024).toFixed(0)} MB
							</p>
						</div>
					</div>
				)}
			</div>

			{error && <p className='mt-1.5 text-sm text-red-400'>{error}</p>}
			{helperText && !error && (
				<p className='mt-1.5 text-sm text-[#606070]'>{helperText}</p>
			)}
		</div>
	);
};
