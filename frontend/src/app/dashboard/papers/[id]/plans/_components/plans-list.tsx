'use client';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Plan {
	id: string;
	version?: number;
	created_at?: string;
	status?: string;
	budget_minutes?: number;
}

interface PlansListProps {
	plans: Plan[];
	paperId: string;
}

export function PlansList({ plans, paperId }: PlansListProps) {
	const router = useRouter();

	const handlePlanClick = (planId: string) => {
		router.push(`/dashboard/papers/${paperId}/plans/${planId}`);
	};

	const formatDate = (dateString?: string) => {
		if (!dateString) return 'N/A';
		try {
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			return 'N/A';
		}
	};

	if (plans.length === 0) {
		return (
			<div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
				<p className="text-gray-600">
					No plans found. Create a plan from the Claims tab.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<div className="border-gray-200 border-b bg-gray-50 px-6 py-4">
				<h3 className="font-semibold text-gray-900">Reproduction Plans</h3>
				<p className="mt-1 text-gray-600 text-sm">
					{plans.length} plan{plans.length !== 1 ? 's' : ''} found
				</p>
			</div>
			<div className="divide-y divide-gray-200">
				{plans.map((plan) => (
					<button
						type="button"
						key={plan.id}
						onClick={() => handlePlanClick(plan.id)}
						className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-gray-50"
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-4">
								<div className="flex-1">
									<h4 className="font-medium text-gray-900">
										Plan Version {plan.version ?? 'N/A'}
									</h4>
									<p className="mt-1 text-gray-600 text-sm">
										Created {formatDate(plan.created_at)}
									</p>
								</div>
								<div className="flex gap-4 text-sm">
									{plan.status && (
										<div>
											<p className="text-gray-600">Status</p>
											<p className="font-medium text-gray-900 capitalize">
												{plan.status}
											</p>
										</div>
									)}
									{plan.budget_minutes && (
										<div>
											<p className="text-gray-600">Budget</p>
											<p className="font-medium text-gray-900">
												{plan.budget_minutes}m
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
						<ChevronRight className="ml-4 h-5 w-5 flex-shrink-0 text-gray-400" />
					</button>
				))}
			</div>
		</div>
	);
}
