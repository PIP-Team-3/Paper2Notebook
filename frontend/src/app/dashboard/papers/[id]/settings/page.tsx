'use client';

import { useState, useEffect, use } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { getPaper } from '../_data/fetchers';
import type { PaperSchema } from '../../_data/schemas';

interface SettingsPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default function SettingsPage({
	params,
}: SettingsPageProps) {
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

	const formatDate = (dateString: string) => {
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-gray-500">Loading paper settings...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg bg-red-50 border border-red-200 p-4">
				<p className="text-red-700 font-medium">Error loading settings</p>
				<p className="text-red-600 text-sm mt-1">{error}</p>
			</div>
		);
	}

	if (!paper) {
		return (
			<div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
				<p className="text-gray-600">No paper data available</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Paper Information Section */}
			<section className="rounded-lg border border-gray-200 bg-white p-6">
				<h3 className="font-semibold text-gray-900 text-lg mb-6">
					Paper Information
				</h3>

				<div className="space-y-6">
					{/* Paper Title */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Title
						</label>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={paper.title}
								readOnly
								className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 text-sm"
							/>
							<button
								onClick={() => handleCopy(paper.title, 'title')}
								className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Paper ID
						</label>
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={paper.id}
								readOnly
								className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 text-sm font-mono"
							/>
							<button
								onClick={() => handleCopy(paper.id, 'id')}
								className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Created Date
						</label>
						<input
							type="text"
							value={formatDate(paper.createdAt)}
							readOnly
							className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 text-sm"
						/>
					</div>

					{/* Status */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Processing Status
						</label>
						<div className="flex items-center gap-2">
							<span
								className={`inline-flex rounded-full px-3 py-1 text-sm font-medium capitalize ${
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

					{/* Stage */}
					{paper.stage && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Current Stage
							</label>
							<input
								type="text"
								value={paper.stage.replace('_', ' ').charAt(0).toUpperCase() + paper.stage.slice(1).toLowerCase()}
								readOnly
								className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 text-sm capitalize"
							/>
						</div>
					)}

					{/* Source URL */}
					{paper.sourceUrl && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Source URL
							</label>
							<div className="flex items-center gap-2">
								<input
									type="text"
									value={paper.sourceUrl}
									readOnly
									className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 text-sm break-all"
								/>
								<a
									href={paper.sourceUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
									title="Open in new tab"
								>
									<ExternalLink className="h-5 w-5 text-gray-500 hover:text-gray-700" />
								</a>
								<button
									onClick={() => handleCopy(paper.sourceUrl || '', 'url')}
									className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
									title="Copy URL"
								>
									{copiedField === 'url' ? (
										<Check className="h-5 w-5 text-green-600" />
									) : (
										<Copy className="h-5 w-5 text-gray-500 hover:text-gray-700" />
									)}
								</button>
							</div>
						</div>
					)}
				</div>
			</section>

			{/* Processing Statistics */}
			{paper.stats && (
				<section className="rounded-lg border border-gray-200 bg-white p-6">
					<h3 className="font-semibold text-gray-900 text-lg mb-6">
						Processing Statistics
					</h3>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="rounded-lg bg-gray-50 p-4">
							<p className="text-sm text-gray-600 mb-1">Tokens Used</p>
							<p className="text-2xl font-bold text-gray-900">
								{paper.stats.tokens?.toLocaleString() ?? 'N/A'}
							</p>
						</div>

						<div className="rounded-lg bg-gray-50 p-4">
							<p className="text-sm text-gray-600 mb-1">Processing Cost</p>
							<p className="text-2xl font-bold text-gray-900">
								${paper.stats.cost?.toFixed(4) ?? 'N/A'}
							</p>
						</div>

						<div className="rounded-lg bg-gray-50 p-4">
							<p className="text-sm text-gray-600 mb-1">Running Time</p>
							<p className="text-2xl font-bold text-gray-900">
								{paper.stats.runningTime ? `${paper.stats.runningTime}s` : 'N/A'}
							</p>
						</div>
					</div>
				</section>
			)}

			{/* Advanced Settings */}
			<section className="rounded-lg border border-gray-200 bg-white p-6">
				<h3 className="font-semibold text-gray-900 text-lg mb-6">
					Advanced Settings
				</h3>

				<div className="space-y-4 text-sm text-gray-600">
					<p>
						Paper management features and additional configuration options will appear here as the system develops.
					</p>

					<div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
						<p className="text-blue-900 font-medium mb-2">API Integration</p>
						<p className="text-blue-800 text-xs">
							You can use the Paper ID above to reference this document in API calls.
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
