import { Skeleton } from '@/components/ui/skeleton';

export default function PlansLoading() {
	return (
		<div className="space-y-6">
			{/* Plans Table skeleton */}
			<div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
				{/* Table header */}
				<div className="border-gray-200 border-b bg-gray-50 px-6 py-4">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="mt-2 h-5 w-32" />
				</div>

				{/* Table body - show multiple skeleton rows */}
				<div className="divide-y divide-gray-200">
					{[...Array(3)].map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between px-6 py-4"
						>
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-4">
									<div className="flex-1 space-y-2">
										{/* Title skeleton */}
										<Skeleton className="h-5 w-40" />
										{/* Date skeleton */}
										<Skeleton className="h-4 w-56" />
									</div>
									{/* Status and Budget skeleton */}
									<div className="flex gap-4">
										<div className="space-y-1">
											<Skeleton className="h-4 w-12" />
											<Skeleton className="h-5 w-16" />
										</div>
										<div className="space-y-1">
											<Skeleton className="h-4 w-12" />
											<Skeleton className="h-5 w-12" />
										</div>
									</div>
								</div>
							</div>
							{/* Chevron skeleton */}
							<Skeleton className="ml-4 h-5 w-5" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
