'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CopyButtonProps {
	text: string;
	field: string;
}

export function CopyButton({ text, field }: CopyButtonProps) {
	const [copiedField, setCopiedField] = useState<string | null>(null);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="rounded-lg p-2 transition-colors hover:bg-gray-100"
			title={`Copy ${field}`}
		>
			{copiedField === field ? (
				<Check className="h-5 w-5 text-green-600" />
			) : (
				<Copy className="h-5 w-5 text-gray-500 hover:text-gray-700" />
			)}
		</button>
	);
}
