import { Skeleton } from '@/components/ui/skeleton';

export default function ClaimsLoading() {
	return (
		<div className="space-y-6">
			{/* Top buttons area skeleton */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					{/* Extract Claims button skeleton */}
					<Skeleton className="h-10 w-36" />
				</div>
				{/* Create Plan button skeleton */}
				<Skeleton className="h-10 w-32" />
			</div>

			{/* Claims table skeleton */}
			<div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				{/* Table header */}
				<div className="border-gray-200 border-b bg-gray-50 px-6 py-4">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="mt-2 h-4 w-64" />
				</div>

				{/* Table body - show multiple skeleton rows */}
				<div className="divide-y divide-gray-200">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="flex items-start gap-4 px-6 py-4">
							{/* Checkbox skeleton */}
							<Skeleton className="mt-1 h-4 w-4" />
							{/* Content skeleton */}
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-5/6" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
