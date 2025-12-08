import { AlertCircle } from 'lucide-react';
import { getAllPlans } from '../_data/fetchers';
import { PlansList } from './_components/plans-list';

interface PlansPageProps {
	params: Promise<{
		id: string;
	}>;
}

interface Plan {
	id: string;
	version?: number;
	created_at?: string;
	status?: string;
	budget_minutes?: number;
}

export default async function PlansPage({ params }: PlansPageProps) {
	const { id } = await params;
	const paperId = id;

	let plans: Plan[] = [];
	let error: string | null = null;

	try {
		const response = await getAllPlans(paperId);
		plans = Array.isArray(response) ? response : [];
	} catch (err) {
		error = err instanceof Error ? err.message : 'Failed to fetch plans';
		console.error('Error fetching plans:', err);
	}

	return (
		<div className="space-y-6">
			{/* Error Message */}
			{error && (
				<div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
					<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
					<div>
						<p className="font-semibold text-red-900 text-sm">
							Error Loading Plans
						</p>
						<p className="mt-1 text-red-700 text-sm">{error}</p>
					</div>
				</div>
			)}

			{/* Plans Table */}
			<PlansList plans={plans} paperId={paperId} />
		</div>
	);
}
