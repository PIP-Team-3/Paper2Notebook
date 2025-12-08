import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
	return (
		<div className="space-y-6">
			{/* Paper Information Section skeleton */}
			<section className="rounded-lg border border-gray-200 bg-white p-6">
				<Skeleton className="mb-6 h-7 w-48" />

				<div className="space-y-6">
					{/* Paper Title skeleton */}
					<div>
						<Skeleton className="mb-2 h-5 w-16" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 flex-1 rounded-lg" />
							<Skeleton className="h-10 w-10 rounded-lg" />
						</div>
					</div>

					{/* Paper ID skeleton */}
					<div>
						<Skeleton className="mb-2 h-5 w-20" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 flex-1 rounded-lg" />
							<Skeleton className="h-10 w-10 rounded-lg" />
						</div>
					</div>

					{/* Created Date skeleton */}
					<div>
						<Skeleton className="mb-2 h-5 w-28" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</div>

					{/* Status skeleton */}
					<div>
						<Skeleton className="mb-2 h-5 w-36" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-7 w-24 rounded-full" />
						</div>
					</div>

					{/* Source URL skeleton (optional - shown sometimes) */}
					<div>
						<Skeleton className="mb-2 h-5 w-24" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 flex-1 rounded-lg" />
							<Skeleton className="h-10 w-10 rounded-lg" />
						</div>
					</div>
				</div>
			</section>

			{/* Advanced Settings Section skeleton */}
			<section className="rounded-lg border border-gray-200 bg-white p-6">
				<Skeleton className="mb-6 h-7 w-40" />
				<div className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-4/5" />
				</div>
			</section>
		</div>
	);
}
