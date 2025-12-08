import { Skeleton } from '@/components/ui/skeleton';

export default function PlanDetailLoading() {
	return (
		<div className="space-y-6">
			{/* Back Button skeleton */}
			<Skeleton className="h-10 w-40" />

			{/* Plan Display skeleton */}
			<div className="rounded-lg border border-gray-200 bg-gray-50">
				<div className="border-gray-200 border-b bg-gray-100 px-4 py-3">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="mt-1 h-4 w-64" />
				</div>

				<div className="space-y-3 p-4">
					{/* Multiple section skeletons */}
					{[...Array(6)].map((_, i) => (
						<div key={i} className="space-y-2">
							{/* Section header */}
							<Skeleton className="h-10 w-full rounded-lg" />
							{/* Section content */}
							<div className="space-y-2 border-blue-200 border-l-4 bg-blue-50 px-4 py-3">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-4/5" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Test Generation Section skeleton */}
			<div className="space-y-4 border-t pt-6">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-11 w-full" />
			</div>

			{/* Test Execution Section skeleton */}
			<div className="space-y-4 border-t pt-6">
				<Skeleton className="h-7 w-40" />
				<Skeleton className="h-11 w-full" />
			</div>
		</div>
	);
}
