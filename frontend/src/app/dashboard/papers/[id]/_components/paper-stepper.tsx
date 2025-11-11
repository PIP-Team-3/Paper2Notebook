'use client';

import {
	AlertCircle,
	Brain,
	CheckCircle2,
	FileCheck,
	FileText,
	Play,
	TestTube,
	Zap,
	Loader,
	X,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PaperStage } from '../../_data/schemas';
import { paperStages } from '../../_data/schemas';
import { extractClaimsStream, generatePlan, generateTests, getLatestPlan, runTests, streamRunEvents } from '../_data/fetchers';

interface PaperStepperProps {
	currentStage: PaperStage;
	status: string;
	paperId: string;
}

const stageConfig: Record<
	PaperStage,
	{ label: string; description: string; icon: ReactNode }
> = {
	ingest: {
		label: 'Ingest Paper',
		description: 'Uploading',
		icon: <FileText className="h-5 w-5" />,
	},
	extract: {
		label: 'Extract Claims',
		description: 'Parsing',
		icon: <Zap className="h-5 w-5" />,
	},
	plan: {
		label: 'Create Plan',
		description: 'Planning',
		icon: <Brain className="h-5 w-5" />,
	},
	generate_test: {
		label: 'Generate Tests',
		description: 'Creating',
		icon: <TestTube className="h-5 w-5" />,
	},
	run_test: {
		label: 'Run Tests',
		description: 'Testing',
		icon: <Play className="h-5 w-5" />,
	},
	report: {
		label: 'Generate Report',
		description: 'Finalizing',
		icon: <FileCheck className="h-5 w-5" />,
	},
};

interface LogEntry {
	id: string;
	timestamp: string;
	type: 'progress' | 'log' | 'error' | 'complete';
	message: string;
}

export function PaperStepper({
	currentStage,
	status,
	paperId,
}: PaperStepperProps) {
	const [isExtracting, setIsExtracting] = useState(false);
	const [extractError, setExtractError] = useState<string | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [showLogs, setShowLogs] = useState(false);
	const [isPlanGenerating, setIsPlanGenerating] = useState(false);
	const [planError, setPlanError] = useState<string | null>(null);
	const [planResult, setPlanResult] = useState<unknown>(null);
	const [showPlanResult, setShowPlanResult] = useState(false);
	const [isTestsGenerating, setIsTestsGenerating] = useState(false);
	const [testsError, setTestsError] = useState<string | null>(null);
	const [testsResult, setTestsResult] = useState<unknown>(null);
	const [showTestsResult, setShowTestsResult] = useState(false);
	const [isRunning, setIsRunning] = useState(false);
	const [runError, setRunError] = useState<string | null>(null);
	const [runLogs, setRunLogs] = useState<LogEntry[]>([]);
	const [showRunLogs, setShowRunLogs] = useState(false);

	const currentStageIndex = paperStages.indexOf(currentStage);
	const isProcessing = status.toLowerCase() === 'processing';
	const isFailed = status.toLowerCase() === 'failed';

	const getStepStatus = (
		stepIndex: number,
	): 'completed' | 'current' | 'upcoming' | 'failed' => {
		if (isFailed) {
			if (stepIndex === currentStageIndex) return 'failed';
			if (stepIndex < currentStageIndex) return 'completed';
			return 'upcoming';
		}

		if (stepIndex < currentStageIndex) return 'completed';
		if (stepIndex === currentStageIndex) return 'current';
		return 'upcoming';
	};

	const handleExtractClick = async () => {
		try {
			setIsExtracting(true);
			setExtractError(null);
			setLogs([]);
			setShowLogs(true);

			await extractClaimsStream(paperId, (log: LogEntry) => {
				// Add log to display
				setLogs((prev) => [...prev, log]);
				console.log(`[${log.type}] ${log.message}`);
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to extract claims';
			setExtractError(errorMessage);
		} finally {
			setIsExtracting(false);
		}
	};

	const handlePlanClick = async () => {
		try {
			setIsPlanGenerating(true);
			setPlanError(null);
			setPlanResult(null);
			setShowPlanResult(true);

			const result = await generatePlan(paperId);
			setPlanResult(result);
			console.log('Plan generated:', result);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate plan';
			setPlanError(errorMessage);
		} finally {
			setIsPlanGenerating(false);
		}
	};

	const handleTestsClick = async () => {
		try {
			setIsTestsGenerating(true);
			setTestsError(null);
			setTestsResult(null);
			setShowTestsResult(true);

			// Fetch the latest plan from the database
			let plan = planResult;
			if (!plan) {
				plan = await getLatestPlan(paperId);
				console.log('Latest plan fetched:', plan);
			}

			// Extract plan_id from the plan
			const planId = (plan as any)?.id;
			if (!planId) {
				throw new Error('Plan ID not found. Generate a plan first.');
			}

			const result = await generateTests(planId);
			setTestsResult(result);
			console.log('Tests generated:', result);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate tests';
			setTestsError(errorMessage);
		} finally {
			setIsTestsGenerating(false);
		}
	};

	const handleRunClick = async () => {
		try {
			setIsRunning(true);
			setRunError(null);
			setRunLogs([]);
			setShowRunLogs(true);

			// Fetch the latest plan from the database
			let plan = planResult;
			if (!plan) {
				plan = await getLatestPlan(paperId);
				console.log('Latest plan fetched:', plan);
			}

			// Extract plan_id from the plan
			const planId = (plan as any)?.id;
			if (!planId) {
				throw new Error('Plan ID not found. Generate a plan first.');
			}

			// Run tests and get the run_id
			const runResult = await runTests(planId);
			const runId = (runResult as any)?.run_id;
			if (!runId) {
				throw new Error('Run ID not returned from backend');
			}

			console.log('Run started with ID:', runId);

			// Stream run events
			await streamRunEvents(runId, (log: LogEntry) => {
				setRunLogs((prev) => [...prev, log]);
				console.log(`[${log.type}] ${log.message}`);
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to run tests';
			setRunError(errorMessage);
		} finally {
			setIsRunning(false);
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between gap-2">
				{paperStages.map((stage, index) => {
					const stepStatus = getStepStatus(index);
					const isLast = index === paperStages.length - 1;
					const config = stageConfig[stage];
					const isExtractStep = stage === 'extract';
					const isPlanStep = stage === 'plan';
					const isTestsStep = stage === 'generate_test';
					const isRunStep = stage === 'run_test';
					const canClickExtract =
						isExtractStep && stepStatus === 'upcoming' && !isProcessing;
					const canClickPlan =
						isPlanStep && stepStatus === 'upcoming' && !isProcessing;
					const canClickTests =
						isTestsStep && stepStatus === 'upcoming' && !isProcessing;
					const canClickRun =
						isRunStep && stepStatus === 'upcoming' && !isProcessing;
					const canClick = canClickExtract || canClickPlan || canClickTests || canClickRun;

					return (
						<div
							key={stage}
							className="flex flex-1 flex-col items-center gap-3"
						>
							{/* Step Indicator with Icon */}
							<button
								onClick={
									canClickExtract
										? handleExtractClick
										: canClickPlan
											? handlePlanClick
											: canClickTests
												? handleTestsClick
												: canClickRun
													? handleRunClick
													: undefined
								}
								disabled={!canClick || isExtracting || isPlanGenerating || isTestsGenerating || isRunning}
								className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
									stepStatus === 'completed'
										? 'border-green-500 bg-green-50'
										: stepStatus === 'current'
											? 'border-blue-500 bg-blue-50'
											: stepStatus === 'failed'
												? 'border-red-500 bg-red-50'
												: 'border-gray-200 bg-gray-50'
								} ${
									canClick
										? 'cursor-pointer hover:border-blue-400 hover:bg-blue-100'
										: ''
								}`}
								type="button"
							>
								{stepStatus === 'completed' && (
									<CheckCircle2 className="h-6 w-6 text-green-600" />
								)}
								{stepStatus === 'current' && (
									<div
										className={`${
											isProcessing ? 'animate-pulse' : ''
										} text-blue-600`}
									>
										{config.icon}
									</div>
								)}
								{stepStatus === 'failed' && (
									<AlertCircle className="h-6 w-6 text-red-600" />
								)}
								{stepStatus === 'upcoming' && (
									<div
										className={`${
											isExtracting || (isPlanStep && isPlanGenerating) || (isTestsStep && isTestsGenerating) || (isRunStep && isRunning)
												? 'animate-spin'
												: ''
										} text-gray-400`}
									>
										{isExtracting || (isPlanStep && isPlanGenerating) || (isTestsStep && isTestsGenerating) || (isRunStep && isRunning) ? (
											<Loader className="h-5 w-5" />
										) : (
											config.icon
										)}
									</div>
								)}
							</button>

							{/* Connector Line */}
							<div
								className={`-mx-2 h-1 flex-1 transition-colors ${
									isLast ? 'opacity-0' : ''
								} ${
									stepStatus === 'completed'
										? 'bg-green-500'
										: stepStatus === 'current'
											? 'bg-blue-500'
											: 'bg-gray-200'
								}`}
							/>

							{/* Step Content */}
							<div className="flex h-14 w-full flex-col items-center justify-center text-center">
								<p
									className={`font-semibold text-sm ${
										stepStatus === 'completed'
											? 'text-green-700'
											: stepStatus === 'current'
												? 'text-blue-700'
												: stepStatus === 'failed'
													? 'text-red-700'
													: 'text-gray-500'
									}`}
								>
									{config.label}
								</p>
								<p
									className={`text-xs ${
										stepStatus === 'completed'
											? 'text-green-600'
											: stepStatus === 'current'
												? 'text-blue-600'
												: stepStatus === 'failed'
													? 'text-red-600'
													: 'text-gray-400'
									}`}
								>
									{config.description}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Status Footer */}
			<div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-4">
				<p className="font-medium text-gray-700 text-sm">
					Progress: {currentStageIndex + 1} of {paperStages.length} stages
				</p>
				<div className="h-2 w-48 overflow-hidden rounded-full bg-gray-200">
					<div
						className={`h-full transition-all ${
							isFailed
								? 'bg-red-500'
								: isProcessing
									? 'bg-blue-500'
									: 'bg-green-500'
						}`}
						style={{
							width: `${((currentStageIndex + 1) / paperStages.length) * 100}%`,
						}}
					/>
				</div>
			</div>

			{/* Error Display */}
			{extractError && (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-700 text-sm">{extractError}</p>
				</div>
			)}

			{/* Extraction Logs */}
			{showLogs && logs.length > 0 && (
				<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
					<div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
						<p className="font-semibold text-gray-700 text-sm">
							Extraction Logs
						</p>
						<button
							onClick={() => setShowLogs(false)}
							className="text-gray-500 hover:text-gray-700"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					<div className="max-h-64 overflow-y-auto">
						<div className="space-y-1 p-3 font-mono text-xs">
							{logs.map((log) => (
								<div
									key={log.id}
									className={`${
										log.type === 'error'
											? 'text-red-600'
											: log.type === 'complete'
												? 'text-green-600'
												: log.type === 'progress'
													? 'text-blue-600'
													: 'text-gray-600'
									}`}
								>
									<span className="text-gray-400">
										[{log.timestamp}]
									</span>{' '}
									{log.message}
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Plan Error Display */}
			{planError && (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-700 text-sm">{planError}</p>
				</div>
			)}

			{/* Plan Result Display */}
			{showPlanResult && planResult && (
				<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
					<div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
						<p className="font-semibold text-gray-700 text-sm">
							Generated Plan
						</p>
						<button
							onClick={() => setShowPlanResult(false)}
							className="text-gray-500 hover:text-gray-700"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					<div className="max-h-96 overflow-y-auto p-4">
						<pre className="whitespace-pre-wrap rounded bg-white p-3 font-mono text-xs text-gray-700">
							{JSON.stringify(planResult, null, 2)}
						</pre>
					</div>
				</div>
			)}

			{/* Tests Error Display */}
			{testsError && (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-700 text-sm">{testsError}</p>
				</div>
			)}

			{/* Tests Result Display */}
			{showTestsResult && testsResult && (
				<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
					<div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
						<p className="font-semibold text-gray-700 text-sm">
							Generated Tests
						</p>
						<button
							onClick={() => setShowTestsResult(false)}
							className="text-gray-500 hover:text-gray-700"
							type="button"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					<div className="max-h-96 overflow-y-auto p-4">
						<pre className="whitespace-pre-wrap rounded bg-white p-3 font-mono text-xs text-gray-700">
							{JSON.stringify(testsResult, null, 2)}
						</pre>
					</div>
				</div>
			)}

			{/* Run Error Display */}
			{runError && (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-700 text-sm">{runError}</p>
				</div>
			)}

			{/* Run Logs */}
			{showRunLogs && runLogs.length > 0 && (
				<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
					<div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
						<p className="font-semibold text-gray-700 text-sm">
							Run Logs
						</p>
						<button
							onClick={() => setShowRunLogs(false)}
							className="text-gray-500 hover:text-gray-700"
							type="button"
						>
							<X className="h-4 w-4" />
						</button>
					</div>
					<div className="max-h-64 overflow-y-auto">
						<div className="space-y-1 p-3 font-mono text-xs">
							{runLogs.map((log) => (
								<div
									key={log.id}
									className={`${
										log.type === 'error'
											? 'text-red-600'
											: log.type === 'complete'
												? 'text-green-600'
												: log.type === 'progress'
													? 'text-blue-600'
													: 'text-gray-600'
									}`}
								>
									<span className="text-gray-400">
										[{log.timestamp}]
									</span>{' '}
									{log.message}
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
