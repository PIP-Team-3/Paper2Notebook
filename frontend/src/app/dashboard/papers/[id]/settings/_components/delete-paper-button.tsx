'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../../../../../components/ui/button';
import { deletePaper } from '../../../_data/fetchers';

interface DeletePaperButtonProps {
	paperId: string;
	paperTitle: string;
}

export function DeletePaperButton({
	paperId,
	paperTitle,
}: DeletePaperButtonProps) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (
			!confirm(
				`Are you sure you want to delete "${paperTitle}"? This action cannot be undone.`,
			)
		) {
			return;
		}

		setIsDeleting(true);
		try {
			await deletePaper(paperId);
			// Navigate back to papers list after successful deletion
			router.push('/dashboard');
			router.refresh();
		} catch (error) {
			console.error('Delete failed:', error);
			alert(
				`Failed to delete paper: ${error instanceof Error ? error.message : 'Unknown error'}`,
			);
			setIsDeleting(false);
		}
	};

	return (
		<div className="rounded-lg border border-red-200 bg-red-50 p-4">
			<h4 className="mb-2 font-medium text-red-900 text-sm">Danger Zone</h4>
			<p className="mb-4 text-red-700 text-sm">
				Once you delete a paper, there is no going back. Please be certain.
			</p>
			<Button
				variant="destructive"
				onClick={handleDelete}
				disabled={isDeleting}
				className="gap-2"
			>
				<Trash2 className="h-4 w-4" />
				{isDeleting ? 'Deleting...' : 'Delete Paper'}
			</Button>
		</div>
	);
}
