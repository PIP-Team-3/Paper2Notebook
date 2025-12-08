'use client';

import { Check, Copy } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import type { PaperSchema } from '../../_data/schemas';
import { getPaper } from '../_data/fetchers';

interface SettingsPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default function SettingsPage({ params }: SettingsPageProps) {
	const { id } = use(params);
	const paperId = id;
	const [paper, setPaper] = useState<PaperSchema | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [copiedField, setCopiedField] = useState<string | null>(null);

	useEffect(() => {
		const loadPaper = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const data = await getPaper(paperId);
				setPaper(data);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to load paper details';
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		loadPaper();
	}, [paperId]);

	const handleCopy = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			timeZoneName: 'short',
		});
	};

	if (isLoading)
		return (
			<div className="py-12 text-center text-gray-500">
				Loading paper settings...
			</div>
		);
	if (error)
		return <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>;
	if (!paper)
		return (
			<div className="rounded-lg bg-gray-50 p-4 text-gray-600">
				No paper data available
			</div>
		);

	return (
		<div className="space-y-6">
			{/* Paper Information Section */}
			<section className="rounded-lg border border-gray-200 bg-white p-6">
				<h3 className="mb-6 font-semibold text-gray-900 text-lg">
					Paper Information
				</h3>

				<div className="space-y-6">
					{/* Paper Title */}
					<div>
						<label
							htmlFor="paper-title"
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Title
						</label>
						<div className="flex items-center gap-2">
							<input
								id="paper-title"
								type="text"
								value={paper.title}
								readOnly
								className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 text-sm"
							/>
							<button
								type="button"
								onClick={() => handleCopy(paper.title, 'title')}
								className="rounded-lg p-2 transition-colors hover:bg-gray-100"
								title="Copy title"
							>
								{copiedField === 'title' ? (
									<Check className="h-5 w-5 text-green-600" />
								) : (
									<Copy className="h-5 w-5 text-gray-500 hover:text-gray-700" />
								)}
							</button>
						</div>
					</div>

					{/* Paper ID */}
					<div>
						<label
							htmlFor="paper-id"
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Paper ID
						</label>
						<div className="flex items-center gap-2">
							<input
								id="paper-id"
								type="text"
								value={paper.id}
								readOnly
								className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 font-mono text-gray-900 text-sm"
							/>
							<button
								type="button"
								onClick={() => handleCopy(paper.id, 'id')}
								className="rounded-lg p-2 transition-colors hover:bg-gray-100"
								title="Copy ID"
							>
								{copiedField === 'id' ? (
									<Check className="h-5 w-5 text-green-600" />
								) : (
									<Copy className="h-5 w-5 text-gray-500 hover:text-gray-700" />
								)}
							</button>
						</div>
					</div>

					{/* Created Date */}
					<div>
						<label
							htmlFor="created-date"
							className="mb-2 block font-medium text-gray-700 text-sm"
						>
							Created Date
						</label>
						<input
							id="created-date"
							type="text"
							value={formatDate(paper.createdAt)}
							readOnly
							className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 text-sm"
						/>
					</div>

					{/* Status */}
					<div>
						<div className="mb-2 block font-medium text-gray-700 text-sm">
							Processing Status
						</div>
						<div className="flex items-center gap-2">
							<span
								className={`inline-flex rounded-full px-3 py-1 font-medium text-sm capitalize ${
									paper.status === 'processing'
										? 'bg-blue-100 text-blue-800'
										: paper.status === 'completed'
											? 'bg-green-100 text-green-800'
											: 'bg-red-100 text-red-800'
								}`}
							>
								{paper.status.replace('_', ' ')}
							</span>
						</div>
					</div>

					{/* Source URL (if exists) */}
					{paper.sourceUrl && (
						<div>
							<label
								htmlFor="source-url"
								className="mb-2 block font-medium text-gray-700 text-sm"
							>
								Source URL
							</label>
							<div className="flex items-center gap-2">
								<input
									id="source-url"
									type="text"
									value={paper.sourceUrl}
									readOnly
									className="flex-1 break-all rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 text-sm"
								/>
								{/* ... Link/Copy buttons ... */}
							</div>
						</div>
					)}
				</div>
			</section>

			{/* --- Processing Statistics Removed Here --- */}

			{/* Advanced Settings */}
			<section className="rounded-lg border border-gray-200 bg-white p-6">
				<h3 className="mb-6 font-semibold text-gray-900 text-lg">
					Advanced Settings
				</h3>
				{/* ... (Advanced settings content) ... */}
				<div className="space-y-4 text-gray-600 text-sm">
					<p>
						Paper management features and additional configuration options will
						appear here as the system develops.
					</p>
					{/* ... */}
				</div>
			</section>
		</div>
	);
}
