'use client';

import { Brain, FileCheck, FileText, Play, TestTube, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { PaperStage } from '../../_data/schemas';
import { paperStages } from '../../_data/schemas';
import { fetchAPI } from '../../../../../lib/api';
import type { StageConfig } from './step-types';
import { StepIndicator } from './step-indicator';
import { useExtractClaimsStep } from './extract-claims-step';
import { usePlanStep } from './plan-step';
import { useGenerateTestsStep } from './generate-tests-step';
import { useRunTestsStep } from './run-tests-step';
import { LogsDisplay } from './logs-display';
import { ClaimsTable } from './claims-table';
import { GeneratedAssets } from './generated-assets';
import { PlanDisplay } from './plan-display';

interface PaperStepperProps {
	currentStage: PaperStage;
	status: string;
	paperId: string;
	onStepComplete?: () => void;
}

const stageConfig: Record<
	PaperStage,
	StageConfig & { labelPast: string; descriptionPast: string }
> = {
	ingest: {
		label: 'Ingest Paper',
		labelPast: 'Ingested Paper',
		description: 'Uploading',
		descriptionPast: 'Uploaded',
		icon: <FileText className="h-5 w-5" />,
	},
	extract: {
		label: 'Extract Claims',
		labelPast: 'Extracted Claims',
		description: 'Parsing',
		descriptionPast: 'Parsed',
		icon: <Zap className="h-5 w-5" />,
	},
	plan: {
		label: 'Create Plan',
		labelPast: 'Created Plan',
		description: 'Planning',
		descriptionPast: 'Planned',
		icon: <Brain className="h-5 w-5" />,
	},
	generate_test: {
		label: 'Generate Tests',
		labelPast: 'Generated Tests',
		description: 'Creating',
		descriptionPast: 'Created',
		icon: <TestTube className="h-5 w-5" />,
	},
	run_test: {
		label: 'Run Tests',
		labelPast: 'Ran Tests',
		description: 'Testing',
		descriptionPast: 'Tested',
		icon: <Play className="h-5 w-5" />,
	},
	report: {
		label: 'Generate Report',
		labelPast: 'Generated Report',
		description: 'Finalizing',
		descriptionPast: 'Finalized',
		icon: <FileCheck className="h-5 w-5" />,
	},
};

export function PaperStepper({
	currentStage,
	status,
	paperId,
	onStepComplete,
}: PaperStepperProps) {
	const [planResult, setPlanResult] = useState<unknown>(null);
	const [showClaims, setShowClaims] = useState(false);
	const [showAssets, setShowAssets] = useState(false);
	const [showPlan, setShowPlan] = useState(false);

	const currentStageIndex = paperStages.indexOf(currentStage);
	const isProcessing = status.toLowerCase() === 'processing';
	const isFailed = status.toLowerCase() === 'failed';

	// Step hooks
	const extractStep = useExtractClaimsStep(paperId);
	const planStep = usePlanStep(paperId, setPlanResult);
	const testsStep = useGenerateTestsStep(paperId, planResult);
	const runStep = useRunTestsStep(paperId, planResult);

	// Automatically show claims table if we're past the extract stage
	useEffect(() => {
		const extractStageIndex = paperStages.indexOf('extract');
		if (currentStageIndex >= extractStageIndex) {
			setShowClaims(true);
		}
	}, [currentStageIndex]);

	// Automatically show generated assets if we're past the generate_test stage
	useEffect(() => {
		const generateTestStageIndex = paperStages.indexOf('generate_test');
		if (currentStageIndex >= generateTestStageIndex) {
			setShowAssets(true);
		}
	}, [currentStageIndex]);

	// Automatically show plan if we're past the plan stage and have a plan result
	useEffect(() => {
		const planStageIndex = paperStages.indexOf('plan');
		if (currentStageIndex >= planStageIndex && planResult) {
			setShowPlan(true);
		}
	}, [currentStageIndex, planResult]);

	// Fetch plan JSON on page load if we're past the plan stage
	useEffect(() => {
		const fetchPlanOnLoad = async () => {
			const planStageIndex = paperStages.indexOf('plan');
			if (currentStageIndex >= planStageIndex && !planResult) {
				try {
					const plan = await fetchAPI(`/papers/${paperId}/plan-json`);
					setPlanResult(plan);
				} catch (error) {
					console.error('Failed to fetch plan on load:', error);
				}
			}
		};

		fetchPlanOnLoad();
	}, [paperId, currentStageIndex, planResult]);

	const getStepStatus = (
		stepIndex: number,
	): 'completed' | 'current' | 'upcoming' | 'failed' => {
		if (isFailed) {
			if (stepIndex === currentStageIndex) return 'failed';
			if (stepIndex < currentStageIndex) return 'completed';
			return 'upcoming';
		}

		// Treat current stage and all previous stages as completed
		if (stepIndex <= currentStageIndex) return 'completed';
		return 'upcoming';
	};

	const handleStepClick = async (stage: PaperStage) => {
		try {
			if (stage === 'extract') {
				await extractStep.handleExtractClick();
				setShowClaims(true);
			} else if (stage === 'plan') {
				await planStep.handlePlanClick();
			} else if (stage === 'generate_test') {
				await testsStep.handleTestsClick();
			} else if (stage === 'run_test') {
				await runStep.handleRunClick();
			}

			// Trigger refresh after step completes successfully
			if (onStepComplete) {
				onStepComplete();
			}
		} catch (error) {
			console.error(`Error in step ${stage}:`, error);
			// Don't refresh on error
		}
	};

	const isStepLoading = (stage: PaperStage): boolean => {
		switch (stage) {
			case 'extract':
				return extractStep.isExtracting;
			case 'plan':
				return planStep.isPlanGenerating;
			case 'generate_test':
				return testsStep.isTestsGenerating;
			case 'run_test':
				return runStep.isRunning;
			default:
				return false;
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between gap-2">
				{paperStages.map((stage, index) => {
					const stepStatus = getStepStatus(index);
					const isLast = index === paperStages.length - 1;
					const baseConfig = stageConfig[stage];

					// Use past tense for completed steps
					const config =
						stepStatus === 'completed'
							? {
									...baseConfig,
									label: baseConfig.labelPast,
									description: baseConfig.descriptionPast,
								}
							: baseConfig;

					const canClick = stepStatus === 'upcoming' && !isProcessing;
					const isLoading = isStepLoading(stage);

					return (
						<StepIndicator
							key={stage}
							stage={stage}
							stepStatus={stepStatus}
							isProcessing={isProcessing}
							isLoading={isLoading}
							canClick={canClick}
							onClick={canClick ? () => handleStepClick(stage) : undefined}
							config={config}
							isLast={isLast}
						/>
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

			{/* Extract Step - Error and Logs */}
			{extractStep.extractError && (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-700 text-sm">{extractStep.extractError}</p>
				</div>
			)}

			{extractStep.showLogs && (
				<LogsDisplay
					title="Extraction Logs"
					logs={extractStep.logs}
					onClose={() => extractStep.setShowLogs(false)}
				/>
			)}

			<ClaimsTable
				paperId={paperId}
				show={showClaims}
				onClose={() => setShowClaims(false)}
			/>

			{/* Plan Step - Error and Result */}
			{planStep.planError && (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-700 text-sm">{planStep.planError}</p>
				</div>
			)}

			<PlanDisplay
				plan={planResult}
				show={showPlan}
				onClose={() => setShowPlan(false)}
			/>

			{/* Tests Step - Error and Result */}
			{testsStep.testsError && (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-700 text-sm">{testsStep.testsError}</p>
				</div>
			)}

			{testsStep.showTestsResult && testsStep.testsResult && (
				<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
					<div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
						<p className="font-semibold text-gray-700 text-sm">
							Generated Tests
						</p>
						<button
							onClick={() => testsStep.setShowTestsResult(false)}
							className="text-gray-500 hover:text-gray-700"
							type="button"
						>
							×
						</button>
					</div>
					<div className="max-h-96 overflow-y-auto p-4">
						<pre className="whitespace-pre-wrap rounded bg-white p-3 font-mono text-xs text-gray-700">
							{JSON.stringify(testsStep.testsResult, null, 2)}
						</pre>
					</div>
				</div>
			)}

			<GeneratedAssets
				paperId={paperId}
				planResult={planResult}
				show={showAssets}
				onClose={() => setShowAssets(false)}
			/>

			{/* Run Step - Error and Logs */}
			{runStep.runError && (
				<div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
					<p className="text-red-700 text-sm">{runStep.runError}</p>
				</div>
			)}

			{runStep.showRunLogs && (
				<LogsDisplay
					title="Run Logs"
					logs={runStep.runLogs}
					onClose={() => runStep.setShowRunLogs(false)}
				/>
			)}
		</div>
	);
}
