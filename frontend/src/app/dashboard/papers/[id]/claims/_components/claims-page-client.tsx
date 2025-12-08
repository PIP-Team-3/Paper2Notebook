'use client';

import {
	AlertCircle,
	CheckCircle2,
	Loader2,
	Terminal,
	Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import type { LogEntry } from '../../_components/step-types';
import { extractClaimsStream, generatePlan } from '../../_data/fetchers';
import type { Claim } from '../_types/claim';
import { ClaimsTable } from './claims-table';

interface ClaimsPageClientProps {
	paperId: string;
	initialClaims: Claim[];
}

export function ClaimsPageClient({
	paperId,
	initialClaims,
}: ClaimsPageClientProps) {
	const router = useRouter();

	const [isExtracting, setIsExtracting] = useState(false);
	const [showLogDialog, setShowLogDialog] = useState(false);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [extractError, setExtractError] = useState<string | null>(null);
	const [claimsExtracted, setClaimsExtracted] = useState(false);
	const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());
	const [isCreatingPlan, setIsCreatingPlan] = useState(false);

	const logsEndRef = useRef<HTMLDivElement>(null);

	// Auto scroll logs
	useEffect(() => {
		if (showLogDialog) {
			logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [showLogDialog]);

	const handleExtractClick = async () => {
		setIsExtracting(true);
		setExtractError(null);
		setLogs([]);
		setShowLogDialog(true);
		setClaimsExtracted(false);

		try {
			await extractClaimsStream(paperId, (log: LogEntry) => {
				setLogs((prev) => [...prev, log]);
			});
			setClaimsExtracted(true);
			// Trigger server refresh to get new claims
			router.refresh();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to extract claims';
			setExtractError(errorMessage);
		} finally {
			setIsExtracting(false);
		}
	};

	const handleCreatePlan = async () => {
		setIsCreatingPlan(true);
		try {
			await generatePlan(paperId, Array.from(selectedClaims));
			router.push(`/dashboard/papers/${paperId}/plans`);
		} catch (err) {
			alert(
				`Plan creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
			);
		} finally {
			setIsCreatingPlan(false);
		}
	};

	return (
		<div className="space-y-6">
			{/* Top buttons area */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button onClick={handleExtractClick} disabled={isExtracting}>
						<Zap className="mr-2 h-4 w-4" />
						{isExtracting ? 'Extracting...' : 'Extract Claims'}
					</Button>

					{claimsExtracted && (
						<div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 font-medium text-green-700 text-sm">
							<CheckCircle2 className="h-4 w-4" />
							<span>Extraction Complete</span>
						</div>
					)}
				</div>

				<Button
					onClick={handleCreatePlan}
					disabled={selectedClaims.size === 0 || isCreatingPlan}
					variant={selectedClaims.size > 0 ? 'default' : 'secondary'}
				>
					{isCreatingPlan ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Creating Plan...
						</>
					) : (
						`Create Plan (${selectedClaims.size})`
					)}
				</Button>
			</div>

			{/* Error message */}
			{extractError && (
				<div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
					<AlertCircle className="h-5 w-5 shrink-0" />
					<p>{extractError}</p>
				</div>
			)}

			{/* Claims table */}
			<ClaimsTable
				paperId={paperId}
				show={true}
				onSelectionsChange={setSelectedClaims}
				initialClaims={initialClaims}
			/>

			{/* Log dialog */}
			<Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
				<DialogContent className="flex max-h-[80vh] max-w-2xl flex-col sm:max-h-[700px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Terminal className="h-5 w-5 text-gray-500" />
							Extraction In Progress
						</DialogTitle>
						<DialogDescription>
							AI Agents are reading the paper and identifying claims...
						</DialogDescription>
					</DialogHeader>

					{/* Progress bar */}
					{isExtracting && (
						<div className="w-full space-y-1">
							<div className="flex justify-between text-gray-500 text-xs">
								<span>Processing</span>
								<span>{logs.length} events</span>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
								<div
									className="h-full animate-progress-indeterminate bg-blue-500"
									style={{ width: '100%', transformOrigin: '0% 50%' }}
								></div>
							</div>
						</div>
					)}

					{/* Logs output */}
					<div className="flex-1 overflow-y-auto rounded-md border border-gray-800 bg-gray-950 p-4 font-mono text-gray-300 text-xs shadow-inner">
						<div className="space-y-1">
							{logs.length === 0 && isExtracting && (
								<div className="animate-pulse text-gray-500">
									Initializing extraction agents...
								</div>
							)}
							{logs.map((log) => (
								<div
									key={`${log.id}${log.message}`}
									className="break-all border-gray-800 border-l-2 pl-2 hover:border-gray-700"
								>
									<span className="mr-2 text-gray-600">[{log.timestamp}]</span>
									<span
										className={
											log.type === 'error'
												? 'font-bold text-red-400'
												: log.type === 'progress'
													? 'text-blue-400'
													: log.type === 'complete'
														? 'font-bold text-green-400'
														: 'text-gray-300'
										}
									>
										{log.message}
									</span>
								</div>
							))}
							<div ref={logsEndRef} />
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="secondary"
							onClick={() => setShowLogDialog(false)}
							disabled={isExtracting}
						>
							{isExtracting ? 'Extracting...' : 'Close'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
