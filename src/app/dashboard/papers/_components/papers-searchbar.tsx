'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PapersSearchbarProps {
	onSearch: (query: string) => void;
}

export function PapersSearchbar({ onSearch }: PapersSearchbarProps) {
	return (
		<div className="mb-6 flex items-center gap-2">
			<Search className="h-5 w-5 text-gray-400" />
			<Input
				type="text"
				placeholder="Search papers by name..."
				onChange={(e) => onSearch(e.target.value)}
				className="flex-1"
			/>
		</div>
	);
}
