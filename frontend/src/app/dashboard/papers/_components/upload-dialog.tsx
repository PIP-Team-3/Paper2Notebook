'use client';

import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DragEvent } from 'react';
import { type ChangeEvent, useState } from 'react';
import { Button } from '../../../../components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '../../../../components/ui/dialog';
import { uploadPaper } from '../_data/fetchers';

interface UploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
	const router = useRouter();
	const [file, setFile] = useState<File | null>(null);
	const [datasetFile, setDatasetFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const handleDragOver = (e: DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			const droppedFile = files[0];
			if (droppedFile.type === 'application/pdf') {
				setFile(droppedFile);
			}
		}
	};

	const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			const selectedFile = files[0];
			if (selectedFile.type === 'application/pdf') {
				setFile(selectedFile);
			}
		}
	};

	const handleDatasetFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (files && files.length > 0) {
			const selectedFile = files[0];
			const validExtensions = ['.xlsx', '.xls', '.csv'];
			const fileName = selectedFile.name.toLowerCase();
			const isValidType = validExtensions.some((ext) => fileName.endsWith(ext));
			if (isValidType) {
				setDatasetFile(selectedFile);
			} else {
				alert('Please select a valid dataset file (.xlsx, .xls, or .csv)');
			}
		}
	};

	const handleUpload = async () => {
		if (!file) {
			return;
		}

		setIsUploading(true);

		try {
			await uploadPaper(
				file,
				undefined,
				datasetFile || undefined,
			);

			// Success - close dialog and refresh papers list
			onOpenChange(false);
			setFile(null);
			setDatasetFile(null);
			router.refresh();
		} catch (error) {
			console.error('Upload failed:', error);
			// Keep dialog open so user can retry
			alert(
				`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleDialogOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setFile(null);
			setDatasetFile(null);
		}
		onOpenChange(newOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleDialogOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Upload Paper</DialogTitle>
					<DialogDescription>
						Upload a PDF file
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* PDF Dropzone */}
					<div>
						<label
							htmlFor="file-input"
							className="mb-2 block font-medium text-sm"
						>
							Paper PDF
						</label>
						<button
							type="button"
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							className={`w-full cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
								isDragging
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-300 hover:border-gray-400'
							}`}
						>
							<input
								type="file"
								accept=".pdf"
								onChange={handleFileSelect}
								className="hidden"
								id="file-input"
							/>
							<label htmlFor="file-input" className="block cursor-pointer">
								<Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
								<p className="font-medium text-sm">
									{file ? file.name : 'Drag and drop your PDF here'}
								</p>
								<p className="mt-1 text-gray-500 text-xs">
									or click to select a file
								</p>
							</label>
						</button>
					</div>

					{/* Optional Dataset File Input */}
					<div>
						<label
							htmlFor="dataset-input"
							className="mb-2 block font-medium text-sm"
						>
							Dataset (Optional)
						</label>
						<div className="w-full cursor-pointer rounded-lg border-2 border-gray-300 border-dashed p-6 text-center transition hover:border-gray-400">
							<input
								type="file"
								accept=".xlsx,.xls,.csv"
								onChange={handleDatasetFileSelect}
								className="hidden"
								id="dataset-input"
							/>
							<label
								htmlFor="dataset-input"
								className="block cursor-pointer"
							>
								<p className="text-sm">
									{datasetFile
										? datasetFile.name
										: 'Click to select a dataset'}
								</p>
								<p className="mt-1 text-gray-500 text-xs">
									.xlsx, .xls, or .csv
								</p>
							</label>
						</div>
						{datasetFile && (
							<button
								type="button"
								onClick={() => setDatasetFile(null)}
								className="mt-2 text-red-600 text-sm hover:text-red-800"
							>
								Remove dataset
							</button>
						)}
					</div>
				</div>

				{/* Upload Button */}
				<Button
					onClick={handleUpload}
					disabled={!file || isUploading}
					className="w-full"
				>
					{isUploading ? 'Uploading...' : 'Upload'}
				</Button>
			</DialogContent>
		</Dialog>
	);
}
