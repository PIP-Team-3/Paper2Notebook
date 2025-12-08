'use client';

import { useEffect, useState } from 'react';
import { Download, AlertCircle, FileCode, FileText } from 'lucide-react';
import { fetchAPI } from '../../../../../../lib/api';

interface AssetsResponse {
	notebook_signed_url: string;
	env_signed_url: string;
	expires_at: string;
}

interface GeneratedAssetsProps {
	planId: string;
	show: boolean;
	onClose: () => void;
}

export function GeneratedAssets({
	planId,
	show,
	onClose,
}: GeneratedAssetsProps) {
	const [assets, setAssets] = useState<AssetsResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!show) return;

		const fetchAssets = async () => {
			try {
				setIsLoading(true);
				setError(null);

				const response: AssetsResponse = await fetchAPI(
					`/plans/${planId}/download-urls`,
				);
				setAssets(response);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to fetch assets';
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		fetchAssets();
	}, [planId, show]);

	if (!show) return null;

	const handleDownload = async (url: string, filename: string) => {
		try {
			setIsLoading(true);
			setError(null);

			const res = await fetch(url, { method: 'GET' });
			if (!res.ok)
				throw new Error(`Download failed: ${res.status} ${res.statusText}`);

			// Try to parse filename from Content-Disposition header if present
			let finalName = filename;
			const cd = res.headers.get('content-disposition');
			if (cd) {
				const match = /filename\*?=(?:UTF-8'')?["']?([^;"']+)/i.exec(cd);
				if (match?.[1]) {
					try {
						finalName = decodeURIComponent(match[1]);
					} catch {
						finalName = match[1];
					}
				}
			}

			const blob = await res.blob();
			const blobUrl = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = blobUrl;
			link.download = finalName;
			// append to DOM to make click work in some browsers
			document.body.appendChild(link);
			link.click();
			link.remove();

			// cleanup
			URL.revokeObjectURL(blobUrl);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Failed to download file';
			setError(message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
			<div className="flex items-center justify-between border-gray-200 border-b bg-gray-100 px-4 py-2">
				<div>
					<p className="font-semibold text-gray-700 text-sm">Generated Files</p>
					<p className="text-gray-500 text-xs">
						Download notebook and requirements
					</p>
				</div>
			</div>

			<div className="p-4">
				{isLoading && (
					<div className="text-center text-gray-500 text-sm">
						Loading assets...
					</div>
				)}

				{error && (
					<div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3">
						<AlertCircle className="h-4 w-4 text-red-500" />
						<p className="text-red-700 text-sm">{error}</p>
					</div>
				)}

				{!isLoading && !error && assets && (
					<div className="flex flex-col gap-3">
						<button
							onClick={() =>
								handleDownload(assets.notebook_signed_url, 'notebook.ipynb')
							}
							className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
							type="button"
						>
							<FileCode className="h-5 w-5 text-blue-600" />
							<div className="flex-1 text-left">
								<p className="font-medium text-gray-900 text-sm">
									Jupyter Notebook
								</p>
								<p className="text-gray-500 text-xs">notebook.ipynb</p>
							</div>
							<Download className="h-4 w-4 text-gray-400" />
						</button>

						<button
							onClick={() =>
								handleDownload(assets.env_signed_url, 'requirements.txt')
							}
							className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 transition-colors hover:bg-gray-50"
							type="button"
						>
							<FileText className="h-5 w-5 text-green-600" />
							<div className="flex-1 text-left">
								<p className="font-medium text-gray-900 text-sm">
									Requirements File
								</p>
								<p className="text-gray-500 text-xs">requirements.txt</p>
							</div>
							<Download className="h-4 w-4 text-gray-400" />
						</button>

						{assets.expires_at && (
							<p className="text-center text-gray-400 text-xs">
								Links expire: {new Date(assets.expires_at).toLocaleString()}
							</p>
						)}
					</div>
				)}

				{!isLoading && !error && !assets && (
					<div className="text-center text-gray-500 text-sm">
						No generated files available yet
					</div>
				)}
			</div>
		</div>
	);
}
