'use client';

import { useState, use } from 'react';
import { BookOpen, Loader2, ExternalLink, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createStoryboard } from '../_data/fetchers';

export default function ModulesPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<{ signed_url: string } | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleRunStorybook = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const data = await createStoryboard(id);
			setResult(data);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Failed to run module');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h2 className="text-lg font-semibold text-gray-900">Analysis Modules</h2>
				<p className="text-sm text-gray-500">
					Apply AI agents to generate simplified explanations and auxiliary content.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Kid-Mode Storybook Module Card */}
				<div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
					<div>
						<div className="mb-4 flex items-center justify-between">
							<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
								<BookOpen className="h-6 w-6" />
							</div>
							{result && (
								<span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold uppercase text-green-700">
									Generated
								</span>
							)}
						</div>

						<h3 className="mb-2 text-base font-bold text-gray-900">
							Kid-Mode Storybook
						</h3>
						<p className="mb-6 text-sm text-gray-500">
							Generates a Grade-3 reading level visual explanation of the paper
							using AI agents. Creates 5-7 pages with alt-text descriptions.
						</p>

						{error && (
							<div className="mb-4 flex items-start gap-2 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-600">
								<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
								<p>{error}</p>
							</div>
						)}
					</div>

					<div className="mt-auto">
						{result ? (
							<div className="space-y-3">
								<a
									href={result.signed_url}
									target="_blank"
									rel="noopener noreferrer"
									className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
								>
									<ExternalLink className="h-4 w-4" />
									Open Storyboard JSON
								</a>
								<Button
									variant="outline"
									onClick={handleRunStorybook}
									className="w-full"
									disabled={isLoading}
								>
									{isLoading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : null}
									Regenerate
								</Button>
							</div>
						) : (
							<Button
								onClick={handleRunStorybook}
								className="w-full bg-gray-900 hover:bg-gray-800"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Generating Story...
									</>
								) : (
									<>
										Generate Storybook <ArrowRight className="ml-2 h-4 w-4" />
									</>
								)}
							</Button>
						)}
					</div>
				</div>

				{/* Coming Soon Placeholder */}
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center opacity-60">
					<div className="mb-2 font-medium text-gray-400">More Coming Soon</div>
					<p className="text-xs text-gray-400">
						Comparison Analysis, Podcast Generator
					</p>
				</div>
			</div>
		</div>
	);
}