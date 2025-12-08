import { Skeleton } from '@/components/ui/skeleton';

export default function ModulesLoading() {
	return (
		<div className="space-y-6">
			{/* Header skeleton */}
			<div>
				<Skeleton className="h-7 w-48" />
				<Skeleton className="mt-2 h-5 w-96" />
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				{/* Kid-Mode Storybook Module Card skeleton */}
				<div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
					<div>
						<div className="mb-4 flex items-center justify-between">
							{/* Icon skeleton */}
							<Skeleton className="h-12 w-12 rounded-lg" />
						</div>

						{/* Title skeleton */}
						<Skeleton className="mb-2 h-6 w-48" />
						{/* Description skeleton */}
						<div className="mb-6 space-y-2">
							<Skeleton className="h-4 w-full" />
							<Skeleton className="h-4 w-4/5" />
						</div>
					</div>

					<div className="mt-auto">
						{/* Button skeleton */}
						<Skeleton className="h-11 w-full rounded-lg" />
					</div>
				</div>

				{/* Coming Soon Placeholder */}
				<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 border-dashed bg-gray-50/50 p-6 text-center opacity-60">
					<div className="mb-2 font-medium text-gray-400">More Coming Soon</div>
					<p className="text-gray-400 text-xs">
						Comparison Analysis, Podcast Generator
					</p>
				</div>
			</div>
		</div>
	);
}
