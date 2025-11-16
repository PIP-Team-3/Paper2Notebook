'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { generatePlan } from '../_data/fetchers';
import type { BaseStepProps } from './step-types';

export function usePlanStep(
	paperId: string,
	setPlanResult: (result: unknown) => void,
) {
	const [isPlanGenerating, setIsPlanGenerating] = useState(false);
	const [planError, setPlanError] = useState<string | null>(null);
	const [showPlanResult, setShowPlanResult] = useState(false);

	const handlePlanClick = async () => {
		try {
			setIsPlanGenerating(true);
			setPlanError(null);
			setPlanResult(null);
			setShowPlanResult(true);

			const result = await generatePlan(paperId);
			setPlanResult(result['plan_json']);
			console.log('Plan generated:', result);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to generate plan';
			setPlanError(errorMessage);
		} finally {
			setIsPlanGenerating(false);
		}
	};

	return {
		isPlanGenerating,
		planError,
		showPlanResult,
		setShowPlanResult,
		handlePlanClick,
	};
}
