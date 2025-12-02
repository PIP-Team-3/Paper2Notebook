'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { extractClaimsStream, generatePlan } from '../_data/fetchers';
import { ClaimsTable } from './_components/claims-table';
import { LogsDisplay } from './_components/logs-display';
import type { LogEntry } from '../_components/step-types';

interface ClaimsPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default function ClaimsPage({
	params,
}: ClaimsPageProps) {
	const { id } = use(params);
	const paperId = id;
	const router = useRouter();

	const [isExtracting, setIsExtracting] = useState(false);
	const [extractError, setExtractError] = useState<string | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [showLogs, setShowLogs] = useState(false);
	const [claimsExtracted, setClaimsExtracted] = useState(false);
	const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());
	const [isCreatingPlan, setIsCreatingPlan] = useState(false);
	const [planError, setPlanError] = useState<string | null>(null);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const handleExtractClick = async () => {
		try {
			setIsExtracting(true);
			setExtractError(null);
			setLogs([]);
			setShowLogs(true);
			setClaimsExtracted(false);

			await extractClaimsStream(paperId, (log: LogEntry) => {
				setLogs((prev) => [...prev, log]);
				console.log(`[${log.type}] ${log.message}`);
			});

			setClaimsExtracted(true);

			// Trigger claims table to refetch without full page refresh
			setRefreshTrigger((prev) => prev + 1);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to extract claims';
			setExtractError(errorMessage);
		} finally {
			setIsExtracting(false);
		}
	};

	const handleCreatePlan = async () => {
		try {
			setIsCreatingPlan(true);
			setPlanError(null);

			// Convert selectedClaims Set to array
			const claimIdsArray = Array.from(selectedClaims);

			// Call the generatePlan API with selected claim IDs
			await generatePlan(paperId, claimIdsArray);

			// Navigate to the plans tab
			router.push(`/dashboard/papers/${paperId}/plans`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to create plan';
			setPlanError(errorMessage);
		} finally {
			setIsCreatingPlan(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Extract Claims Button */}
			<div className="flex gap-3">
				<Button
					onClick={handleExtractClick}
					disabled={isExtracting}
				>
					<Zap className="mr-2 h-4 w-4" />
					{isExtracting ? 'Extracting Claims...' : 'Extract Claims'}
				</Button>

				{claimsExtracted && (
					<div className="flex items-center rounded-lg bg-green-50 px-4 py-3 border border-green-200">
						<p className="text-green-800 font-medium text-sm">
							✓ Claims extracted successfully
						</p>
					</div>
				)}
			</div>

			{/* Error Message */}
			{extractError && (
				<div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
					<AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
					<div>
						<p className="font-semibold text-red-900 text-sm">
							Extraction Error
						</p>
						<p className="text-red-700 text-sm mt-1">{extractError}</p>
					</div>
				</div>
			)}

			{/* Logs Display */}
			{showLogs && logs.length > 0 && (
				<div className="rounded-lg border border-gray-200 bg-white">
					<div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
						<div className="flex items-center justify-between">
							<p className="font-semibold text-gray-700 text-sm">
								Extraction Logs
							</p>
							<button
								onClick={() => setShowLogs(!showLogs)}
								className="text-gray-500 hover:text-gray-700 text-sm font-medium"
							>
								{showLogs ? 'Hide' : 'Show'}
							</button>
						</div>
					</div>
					{showLogs && (
						<LogsDisplay
							logs={logs}
							onClose={() => setShowLogs(false)}
						/>
					)}
				</div>
			)}

			{/* Claims Table */}
			<ClaimsTable
				paperId={paperId}
				show={true}
				onClose={() => {}}
				onSelectionsChange={setSelectedClaims}
				refreshTrigger={refreshTrigger}
			/>

			{/* Create Plan Button */}
			<div className="flex gap-3">
				<Button
					onClick={handleCreatePlan}
					disabled={selectedClaims.size === 0 || isCreatingPlan}
				>
					<Zap className="mr-2 h-4 w-4" />
					{isCreatingPlan ? 'Creating Plan...' : `Create Plan (${selectedClaims.size})`}
				</Button>
			</div>

			{/* Plan Creation Error */}
			{planError && (
				<div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
					<AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
					<div>
						<p className="font-semibold text-red-900 text-sm">
							Plan Creation Error
						</p>
						<p className="text-red-700 text-sm mt-1">{planError}</p>
					</div>
				</div>
			)}
		</div>
	);
}
