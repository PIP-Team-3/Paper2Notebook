'use client';

import { useState } from 'react';
import { runTests, streamRunEvents, getLatestPlan } from '../_data/fetchers';
import type { BaseStepProps, LogEntry } from './step-types';
import { LogsDisplay } from './logs-display';

export function useRunTestsStep(paperId: string, planResult: unknown) {
	const [isRunning, setIsRunning] = useState(false);
	const [runError, setRunError] = useState<string | null>(null);
	const [runLogs, setRunLogs] = useState<LogEntry[]>([]);
	const [showRunLogs, setShowRunLogs] = useState(false);

	const handleRunClick = async () => {
		try {
			setIsRunning(true);
			setRunError(null);
			setRunLogs([]);
			setShowRunLogs(true);

			// Fetch the latest plan from the database
			// let plan = planResult;
			// if (!plan) {
			const plan = await getLatestPlan(paperId);
			console.log('Latest plan fetched:', plan);
			// }

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

	return {
		isRunning,
		runError,
		runLogs,
		showRunLogs,
		setShowRunLogs,
		handleRunClick,
	};
}
