'use client';

import { AlertCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Checkbox } from '../../../../../../components/ui/checkbox';
import { fetchAPI } from '../../../../../../lib/api';
import type { Claim } from '../_types/claim';

interface ClaimsTableProps {
	paperId: string;
	show: boolean;
	onSelectionsChange?: (selectedClaims: Set<string>) => void;
	initialClaims?: Claim[];
}

export function ClaimsTable({
	paperId,
	show,
	onSelectionsChange,
	initialClaims = [],
}: ClaimsTableProps) {
	const [claims, setClaims] = useState<Claim[]>(initialClaims);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());

	// Update claims when initialClaims changes (e.g., after extraction)
	useEffect(() => {
		setClaims(initialClaims);
	}, [initialClaims]);

	// Only fetch if we don't have initial claims
	useEffect(() => {
		if (!show || initialClaims.length > 0) return;

		const fetchClaims = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const response = await fetchAPI(`/papers/${paperId}/claims`);

				// The API returns an array of claims directly
				if (Array.isArray(response)) {
					setClaims(response);
				} else if (response.claims) {
					// Fallback if the response has a claims property
					setClaims(response.claims);
				} else {
					setClaims([]);
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to fetch claims';
				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		fetchClaims();
	}, [paperId, show, initialClaims.length]);

	useEffect(() => {
		onSelectionsChange?.(selectedClaims);
	}, [selectedClaims, onSelectionsChange]);

	const handleSelectClaim = useCallback((claimId: string) => {
		setSelectedClaims((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(claimId)) {
				newSet.delete(claimId);
			} else {
				newSet.add(claimId);
			}
			return newSet;
		});
	}, []);

	const handleSelectAll = useCallback(() => {
		setSelectedClaims((prev) => {
			if (prev.size === claims.length) {
				return new Set();
			} else {
				return new Set(claims.map((c) => c.id));
			}
		});
	}, [claims]);

	if (!show) return null;

	return (
		<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
			<div className="border-gray-200 border-b bg-gray-100 px-4 py-3">
				<div>
					<p className="font-semibold text-gray-700 text-sm">
						Extracted Claims
					</p>
					{claims.length > 0 && (
						<p className="text-gray-500 text-xs">
							{selectedClaims.size} of {claims.length} claim
							{claims.length !== 1 ? 's' : ''} selected
						</p>
					)}
				</div>
			</div>

			<div className="p-4">
				{isLoading && (
					<div className="text-center text-gray-500 text-sm">
						Loading claims...
					</div>
				)}

				{error && (
					<div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3">
						<AlertCircle className="h-4 w-4 text-red-500" />
						<p className="text-red-700 text-sm">{error}</p>
					</div>
				)}

				{!isLoading && !error && claims.length === 0 && (
					<div className="text-center text-gray-500 text-sm">
						No claims extracted yet
					</div>
				)}

				{!isLoading && !error && claims.length > 0 && (
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-gray-200 border-b bg-gray-50">
									<th className="w-12 px-3 py-2 text-center font-semibold text-gray-700 text-xs">
										<Checkbox
											checked={
												selectedClaims.size === claims.length &&
												claims.length > 0
											}
											onCheckedChange={handleSelectAll}
										/>
									</th>
									<th className="px-3 py-2 text-left font-semibold text-gray-700 text-xs">
										Dataset
									</th>
									<th className="px-3 py-2 text-left font-semibold text-gray-700 text-xs">
										Split
									</th>
									<th className="px-3 py-2 text-left font-semibold text-gray-700 text-xs">
										Metric
									</th>
									<th className="px-3 py-2 text-right font-semibold text-gray-700 text-xs">
										Value
									</th>
									<th className="px-3 py-2 text-left font-semibold text-gray-700 text-xs">
										Citation
									</th>
									<th className="px-3 py-2 text-center font-semibold text-gray-700 text-xs">
										Confidence
									</th>
								</tr>
							</thead>
							<tbody>
								{claims.map((claim) => (
									<tr
										key={claim.id}
										className="border-gray-100 border-b hover:bg-gray-50"
									>
										<td className="px-3 py-2 text-center">
											<Checkbox
												checked={selectedClaims.has(claim.id)}
												onCheckedChange={() => handleSelectClaim(claim.id)}
											/>
										</td>
										<td className="px-3 py-2 text-gray-800 text-sm">
											{claim.dataset_name}
										</td>
										<td className="px-3 py-2 text-gray-600 text-sm">
											{claim.split}
										</td>
										<td className="px-3 py-2 text-gray-800 text-sm">
											{claim.metric_name}
										</td>
										<td className="px-3 py-2 text-right font-mono text-gray-800 text-sm">
											{claim.metric_value}
											{claim.units && (
												<span className="ml-1 text-gray-500">
													{claim.units}
												</span>
											)}
										</td>
										<td className="px-3 py-2 text-gray-600 text-xs">
											{claim.source_citation}
										</td>
										<td className="px-3 py-2 text-center">
											<span
												className={`inline-block rounded px-2 py-1 font-mono text-xs ${
													claim.confidence >= 0.9
														? 'bg-green-100 text-green-800'
														: claim.confidence >= 0.7
															? 'bg-yellow-100 text-yellow-800'
															: 'bg-red-100 text-red-800'
												}`}
											>
												{(claim.confidence * 100).toFixed(0)}%
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
