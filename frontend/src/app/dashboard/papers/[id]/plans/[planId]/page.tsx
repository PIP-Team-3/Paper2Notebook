'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchAPI } from '@/lib/api';
import {
	getPlanById,
	generateTests,
	runTests,
	streamRunEvents,
} from '../../_data/fetchers';
import { PlanDisplay } from '../_components/plan-display';
import { GeneratedAssets } from '../_components/generated-assets';
import { LogsDisplay } from '../_components/logs-display';
import type { LogEntry } from '../../_components/step-types';

interface PlanDetailPageProps {
	params: Promise<{
		id: string;
		planId: string;
	}>;
}

export default function PlanDetailPage({ params }: PlanDetailPageProps) {
	const { id, planId } = use(params);
	const paperId = id;
	const router = useRouter();

	// Use a ref to maintain a counter for unique log IDs
	const logIdCounterRef = React.useRef(0);

	const generateUniqueLogId = (prefix: string) => {
		return `${prefix}-${Date.now()}-${++logIdCounterRef.current}`;
	};

	const [plan, setPlan] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Generate tests state
	const [isGeneratingTests, setIsGeneratingTests] = useState(false);
	const [generateTestsError, setGenerateTestsError] = useState<string | null>(
		null,
	);
	const [generateTestsLogs, setGenerateTestsLogs] = useState<LogEntry[]>([]);
	const [showGenerateTestsLogs, setShowGenerateTestsLogs] = useState(false);
	const [testsGenerated, setTestsGenerated] = useState(false);
	const [artifactsExist, setArtifactsExist] = useState(false);
	const [isCheckingArtifacts, setIsCheckingArtifacts] = useState(true);

	// Run tests state
	const [isRunningTests, setIsRunningTests] = useState(false);
	const [runTestsError, setRunTestsError] = useState<string | null>(null);
	const [runTestsLogs, setRunTestsLogs] = useState<LogEntry[]>([]);
	const [showRunTestsLogs, setShowRunTestsLogs] = useState(false);
	const [testsCompleted, setTestsCompleted] = useState(false);
	const [metrics, setMetrics] = useState<
		Array<{
			metric: string;
			value: number;
			split: string;
			ts?: string;
		}>
	>([]);

	useEffect(() => {
		const fetchPlan = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const response = await getPlanById(paperId, planId);
				setPlan(response);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to fetch plan';
				setError(errorMessage);
				console.error('Error fetching plan:', err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPlan();
	}, [paperId, planId]);

	// Check if artifacts already exist for this plan
	useEffect(() => {
		const checkArtifacts = async () => {
			try {
				setIsCheckingArtifacts(true);
				const response = await fetchAPI(`/plans/${planId}/download-urls`);
				if (response) {
					setArtifactsExist(true);
					setTestsGenerated(true);
				}
			} catch (_err) {
				// No artifacts found or error checking - that's fine
				setArtifactsExist(false);
			} finally {
				setIsCheckingArtifacts(false);
			}
		};

		if (planId) {
			checkArtifacts();
		}
	}, [planId]);

	const handleBack = () => {
		router.push(`/dashboard/papers/${paperId}/plans`);
	};

	const handleGenerateTests = async () => {
		try {
			setIsGeneratingTests(true);
			setGenerateTestsError(null);
			setGenerateTestsLogs([]);
			setShowGenerateTestsLogs(true);
			setTestsGenerated(false);

			const initialLogId = generateUniqueLogId('generate');
			setGenerateTestsLogs((prev) => [
				...prev,
				{
					id: initialLogId,
					timestamp: new Date().toLocaleTimeString(),
					type: 'progress',
					message: 'Starting notebook materialization...',
				},
			]);

			const result = await generateTests(planId);

			setGenerateTestsLogs((prev) => [
				...prev,
				{
					id: generateUniqueLogId('generate'),
					timestamp: new Date().toLocaleTimeString(),
					type: 'complete',
					message: 'Notebook and requirements generated successfully',
				},
			]);

			setTestsGenerated(true);
			console.log('Tests generated:', result);

			// Refresh the page to update paper stage
			router.refresh();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate tests';
			setGenerateTestsError(errorMessage);

			setGenerateTestsLogs((prev) => [
				...prev,
				{
					id: generateUniqueLogId('generate'),
					timestamp: new Date().toLocaleTimeString(),
					type: 'error',
					message: errorMessage,
				},
			]);
		} finally {
			setIsGeneratingTests(false);
		}
	};

	const handleRunTests = async () => {
		try {
			setIsRunningTests(true);
			setRunTestsError(null);
			setRunTestsLogs([]);
			setShowRunTestsLogs(true);
			setTestsCompleted(false);
			setMetrics([]);

			const initialLogId = generateUniqueLogId('run');
			setRunTestsLogs((prev) => [
				...prev,
				{
					id: initialLogId,
					timestamp: new Date().toLocaleTimeString(),
					type: 'progress',
					message: 'Starting notebook execution...',
				},
			]);

			// Run tests and get the run_id
			const runResult = await runTests(planId);
			const runId = (runResult as any)?.run_id;
			if (!runId) {
				throw new Error('Run ID not returned from backend');
			}

			console.log('Run started with ID:', runId);

			// Keep track of seen messages to prevent duplicates
			const seenMessages = new Set<string>([initialLogId]);

			// Keep track of accumulated logs for metrics parsing
			let metricsBuffer = '';
			let inMetricsBlock = false;
			let metricsExtracted = false;

			// Stream run events
			await streamRunEvents(runId, (log: LogEntry) => {
				// Create a unique key for this log entry (message + timestamp)
				const logKey = `${log.message}|${log.timestamp}|${log.type}`;

				// Skip if we've already seen this exact log entry
				if (seenMessages.has(logKey)) {
					console.log(`Skipping duplicate log: ${log.message}`);
					return;
				}

				seenMessages.add(logKey);

				const newLog = {
					...log,
					id: generateUniqueLogId('run'),
				};

				// Check if this log line is part of metrics JSON output
				if (log.message.includes('"metrics"') && !inMetricsBlock) {
					console.log(
						'[METRICS DEBUG] Detected metrics block start with message:',
						log.message,
					);
					inMetricsBlock = true;
					metricsBuffer = `${log.message}\n`;
					console.log(
						'[METRICS DEBUG] Buffer initialized, length:',
						metricsBuffer.length,
					);
				} else if (inMetricsBlock) {
					console.log('[METRICS DEBUG] Adding to metrics buffer:', log.message);
					metricsBuffer += `${log.message}\n`;
					console.log(
						'[METRICS DEBUG] Buffer length now:',
						metricsBuffer.length,
					);

					// Try to extract metrics if we have a complete JSON object
					// Count braces to detect when JSON is complete
					if (!metricsExtracted) {
						let braceCount = 0;
						let jsonStartIndex = -1;
						let firstBraceAt = -1;
						let lastBraceAt = -1;

						for (let i = 0; i < metricsBuffer.length; i++) {
							const char = metricsBuffer[i];
							if (char === '{') {
								if (jsonStartIndex === -1) {
									jsonStartIndex = i;
									firstBraceAt = i;
									console.log('[METRICS DEBUG] Found first brace at index:', i);
								}
								braceCount++;
								console.log(
									'[METRICS DEBUG] Opening brace at index',
									i,
									'- brace count now:',
									braceCount,
								);
							} else if (char === '}') {
								braceCount--;
								lastBraceAt = i;
								console.log(
									'[METRICS DEBUG] Closing brace at index',
									i,
									'- brace count now:',
									braceCount,
								);
								// When brace count returns to 0, we have a complete JSON object
								if (braceCount === 0 && jsonStartIndex !== -1) {
									console.log(
										'[METRICS DEBUG] Brace count reached 0! Attempting JSON extraction from index',
										jsonStartIndex,
										'to',
										i,
									);
									try {
										const jsonStr = metricsBuffer.substring(
											jsonStartIndex,
											i + 1,
										);
										console.log(
											'[METRICS DEBUG] Extracted JSON string:',
											jsonStr,
										);
										const metricsJson = JSON.parse(jsonStr);
										console.log(
											'[METRICS DEBUG] Successfully parsed JSON:',
											metricsJson,
										);

										// The metrics object could be either:
										// 1. { "metrics": { ... } } - wrapped format
										// 2. { "Winning Probability": 0.714, ... } - direct format
										let metricsData = null;

										if (
											metricsJson.metrics &&
											typeof metricsJson.metrics === 'object'
										) {
											console.log(
												'[METRICS DEBUG] Found wrapped metrics object:',
												metricsJson.metrics,
											);
											metricsData = metricsJson.metrics;
										} else if (
											typeof metricsJson === 'object' &&
											Object.keys(metricsJson).length > 0
										) {
											// Check if this looks like a metrics object (has numeric values)
											const firstValue = Object.values(metricsJson)[0];
											if (typeof firstValue === 'number') {
												console.log(
													'[METRICS DEBUG] Found direct metrics object (unwrapped):',
													metricsJson,
												);
												metricsData = metricsJson;
											}
										}

										if (metricsData) {
											// Parse individual metrics from the object
											const extractedMetrics = Object.entries(metricsData).map(
												([key, value]) => ({
													metric: key,
													value: Number(value),
													split: 'test', // Default to test split since backend doesn't specify
													ts: new Date().toLocaleTimeString(),
												}),
											);
											console.log(
												'[METRICS DEBUG] Extracted metrics array:',
												extractedMetrics,
											);
											console.log('[METRICS DEBUG] Setting metrics in state');
											setMetrics(extractedMetrics);
											metricsExtracted = true;
											inMetricsBlock = false;
											metricsBuffer = '';
											return; // Exit the brace counting loop
										} else {
											console.log(
												'[METRICS DEBUG] Parsed JSON does not appear to be metrics:',
												metricsJson,
											);
										}
									} catch (error) {
										console.error(
											'[METRICS DEBUG] Failed to parse metrics JSON:',
											error,
										);
										console.log(
											'[METRICS DEBUG] Attempted to parse:',
											metricsBuffer.substring(jsonStartIndex, i + 1),
										);
									}
								}
							}
						}
						console.log(
							'[METRICS DEBUG] Brace count loop ended. Final brace count:',
							braceCount,
							', first brace at:',
							firstBraceAt,
							', last brace at:',
							lastBraceAt,
						);
					}
				}

				setRunTestsLogs((prev) => [...prev, newLog]);
				console.log(`[${log.type}] ${log.message}`);
			});

			setTestsCompleted(true);

			// Refresh the page to update paper stage
			router.refresh();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to run tests';
			setRunTestsError(errorMessage);

			setRunTestsLogs((prev) => [
				...prev,
				{
					id: generateUniqueLogId('run'),
					timestamp: new Date().toLocaleTimeString(),
					type: 'error',
					message: errorMessage,
				},
			]);
		} finally {
			setIsRunningTests(false);
		}
	};

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="py-12 text-center">
					<p className="text-gray-500">Loading plan...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Back Button */}
			<button
				onClick={handleBack}
				className="flex items-center gap-2 font-medium text-blue-600 transition-colors hover:text-blue-800"
			>
				<ChevronLeft className="h-5 w-5" />
				Back to Plans
			</button>

			{/* Error Message */}
			{error && (
				<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
					<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
					<div>
						<p className="font-semibold text-red-900 text-sm">
							Error Loading Plan
						</p>
						<p className="mt-1 text-red-700 text-sm">{error}</p>
					</div>
				</div>
			)}

			{/* Plan Display */}
			{plan && (
				<PlanDisplay
					plan={plan.plan_json || plan}
					show={true}
					onClose={() => {}}
				/>
			)}

			{/* Generate Tests Section */}
			<div className="space-y-4 border-t pt-6">
				<h3 className="font-semibold text-gray-900 text-lg">Test Generation</h3>

				<Button
					onClick={handleGenerateTests}
					disabled={isGeneratingTests || artifactsExist || isCheckingArtifacts}
					className="w-full"
				>
					{isCheckingArtifacts
						? 'Checking Tests...'
						: isGeneratingTests
							? 'Generating Tests...'
							: artifactsExist
								? 'Tests Already Generated'
								: 'Generate Tests'}
				</Button>

				{(testsGenerated || artifactsExist) && (
					<div className="flex items-center rounded-lg border border-green-200 bg-green-50 px-4 py-3">
						<p className="font-medium text-green-800 text-sm">
							✓ Tests generated successfully
						</p>
					</div>
				)}

				{/* Generate Tests Error */}
				{generateTestsError && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
						<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
						<div>
							<p className="font-semibold text-red-900 text-sm">
								Test Generation Error
							</p>
							<p className="mt-1 text-red-700 text-sm">{generateTestsError}</p>
						</div>
					</div>
				)}

				{/* Generate Tests Logs */}
				{showGenerateTestsLogs && generateTestsLogs.length > 0 && (
					<LogsDisplay
						title="Generation Logs"
						logs={generateTestsLogs}
						onClose={() => setShowGenerateTestsLogs(false)}
					/>
				)}

				{/* Generated Assets */}
				{(testsGenerated || artifactsExist) && !isCheckingArtifacts && (
					<GeneratedAssets planId={planId} show={true} onClose={() => {}} />
				)}
			</div>

			{/* Run Tests Section */}
			<div className="space-y-4 border-t pt-6">
				<h3 className="font-semibold text-gray-900 text-lg">Test Execution</h3>

				<Button
					onClick={handleRunTests}
					disabled={isRunningTests}
					className="w-full"
				>
					{isRunningTests ? 'Running Tests...' : 'Run Tests'}
				</Button>

				{testsCompleted && (
					<div className="flex items-center rounded-lg border border-green-200 bg-green-50 px-4 py-3">
						<p className="font-medium text-green-800 text-sm">
							✓ Tests completed successfully
						</p>
					</div>
				)}

				{/* Run Tests Error */}
				{runTestsError && (
					<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
						<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
						<div>
							<p className="font-semibold text-red-900 text-sm">
								Execution Error
							</p>
							<p className="mt-1 text-red-700 text-sm">{runTestsError}</p>
						</div>
					</div>
				)}

				{/* Run Tests Logs */}
				{showRunTestsLogs && runTestsLogs.length > 0 && (
					<LogsDisplay
						title="Execution Logs"
						logs={runTestsLogs}
						onClose={() => setShowRunTestsLogs(false)}
					/>
				)}

				{/* Execution Results - Metrics Table */}
				{testsCompleted && metrics.length > 0 && (
					<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
						<div className="border-gray-200 border-b bg-gray-50 px-6 py-4">
							<h3 className="font-semibold text-gray-900">Execution Metrics</h3>
							<p className="mt-1 text-gray-600 text-sm">
								{metrics.length} metric{metrics.length !== 1 ? 's' : ''}{' '}
								collected
							</p>
						</div>
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-gray-200 border-b bg-gray-50">
										<th className="px-6 py-3 text-left font-semibold text-gray-900 text-sm">
											Metric
										</th>
										<th className="px-6 py-3 text-left font-semibold text-gray-900 text-sm">
											Split
										</th>
										<th className="px-6 py-3 text-right font-semibold text-gray-900 text-sm">
											Value
										</th>
										{metrics.some((m) => m.ts) && (
											<th className="px-6 py-3 text-left font-semibold text-gray-900 text-sm">
												Timestamp
											</th>
										)}
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{metrics.map((metric, idx) => (
										<tr
											key={`${metric.metric}-${metric.split}-${idx}`}
											className="hover:bg-gray-50"
										>
											<td className="px-6 py-3 font-medium text-gray-900 text-sm">
												{metric.metric}
											</td>
											<td className="px-6 py-3 text-gray-600 text-sm">
												{metric.split}
											</td>
											<td className="px-6 py-3 text-right font-semibold text-gray-900 text-sm">
												{typeof metric.value === 'number'
													? metric.value.toFixed(4)
													: metric.value}
											</td>
											{metrics.some((m) => m.ts) && (
												<td className="px-6 py-3 text-gray-600 text-sm">
													{metric.ts || '-'}
												</td>
											)}
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{testsCompleted && metrics.length === 0 && (
					<div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
						<p className="text-gray-600">
							No metrics were collected during execution.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
