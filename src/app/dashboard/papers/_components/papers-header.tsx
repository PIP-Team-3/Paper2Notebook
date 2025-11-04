'use client';

import { Upload } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadDialog } from './upload-dialog';

export function PapersHeader() {
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

	return (
		<>
			<div className="mb-8 flex items-center justify-between">
				<h1 className="text-2xl">Your Papers</h1>
				<Button onClick={() => setUploadDialogOpen(true)}>
					<Upload className="mr-2 h-4 w-4" />
					Upload Paper
				</Button>
			</div>
			<UploadDialog
				open={uploadDialogOpen}
				onOpenChange={setUploadDialogOpen}
			/>
		</>
	);
}
