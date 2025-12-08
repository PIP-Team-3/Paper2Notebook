import { fetchAPI } from '@/lib/api';
import { getPlanById } from '../../_data/fetchers';
import { PlanDetailClient } from './_components/plan-detail-client';

interface PlanDetailPageProps {
	params: Promise<{
		id: string;
		planId: string;
	}>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
	const { id, planId } = await params;
	const paperId = id;

	let plan: any = null;
	let error: string | null = null;
	let artifactsExist = false;
	let initialAssets: any = null;

	console.log('hi');
	// Parallelize both fetches
	const [planResult, artifactsResult] = await Promise.allSettled([
		getPlanById(paperId, planId),
		fetchAPI(`/plans/${planId}/download-urls`),
	]);

	console.log('done');
	// Handle plan fetch result
	if (planResult.status === 'fulfilled') {
		plan = planResult.value;
	} else {
		error =
			planResult.reason instanceof Error
				? planResult.reason.message
				: 'Failed to fetch plan';
		console.error('Error fetching plan:', planResult.reason);
	}

	// Handle artifacts check result
	if (artifactsResult.status === 'fulfilled' && artifactsResult.value) {
		artifactsExist = true;
		initialAssets = artifactsResult.value;
	}

	return (
		<PlanDetailClient
			paperId={paperId}
			planId={planId}
			initialPlan={plan}
			initialError={error}
			initialArtifactsExist={artifactsExist}
			initialAssets={initialAssets}
		/>
	);
}
