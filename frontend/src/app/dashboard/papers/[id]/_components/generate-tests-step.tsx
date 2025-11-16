'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { generateTests, getLatestPlan } from '../_data/fetchers';
import type { BaseStepProps } from './step-types';

export function useGenerateTestsStep(paperId: string, planResult: unknown) {
	const [isTestsGenerating, setIsTestsGenerating] = useState(false);
	const [testsError, setTestsError] = useState<string | null>(null);
	const [testsResult, setTestsResult] = useState<unknown>(null);
	const [showTestsResult, setShowTestsResult] = useState(false);

	const handleTestsClick = async () => {
		try {
			setIsTestsGenerating(true);
			setTestsError(null);
			setTestsResult(null);
			setShowTestsResult(true);

			// Fetch the latest plan from the database
			// let plan = planResult;
			// if (!plan) {
			const plan = await getLatestPlan(paperId);
			// 	console.log('Latest plan fetched:', plan);
			// }

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

	return {
		isTestsGenerating,
		testsError,
		testsResult,
		showTestsResult,
		setShowTestsResult,
		handleTestsClick,
	};
}
