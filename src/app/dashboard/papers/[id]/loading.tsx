import { Skeleton } from '@/components/ui/skeleton';
import { paperStages } from '../_data/schemas';

export default function PaperPageLoading() {
	return (
		<div className="w-full max-w-[1200px] p-8">
			{/* Header Skeleton */}
			<div className="mb-6 flex items-center justify-between gap-4 border-b pb-4">
				<Skeleton className="h-8 font-extrabold text-2xl text-transparent">
					Lorem ipsum dolor sit amet consectetur adipiscing
				</Skeleton>
				<div className="flex items-center gap-2">
					<Skeleton className="font-semibold text-sm text-transparent capitalize">
						processing
					</Skeleton>
					<div className="h-6 w-6 rounded-full bg-muted" />
				</div>
			</div>

			{/* Details Grid Skeleton */}
			<div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
				{/* Status Detail Item */}
				<div>
					<Skeleton className="mb-1 font-semibold text-transparent text-xs uppercase tracking-wider">
						Processing Status
					</Skeleton>
					<Skeleton className="font-medium text-sm text-transparent">
						processing
					</Skeleton>
				</div>

				{/* Date Added Detail Item */}
				<div>
					<Skeleton className="mb-1 font-semibold text-transparent text-xs uppercase tracking-wider">
						Date Added
					</Skeleton>
					<Skeleton className="font-medium text-sm text-transparent">
						January 1, 2024, 12:00 PM PST
					</Skeleton>
				</div>

				{/* Paper ID Detail Item */}
				<div>
					<Skeleton className="mb-1 font-semibold text-transparent text-xs uppercase tracking-wider">
						Paper ID
					</Skeleton>
					<Skeleton className="break-all font-medium text-sm text-transparent">
						12345678-1234-5678-1234-567812345678
					</Skeleton>
				</div>
			</div>

			{/* Stats Section Skeleton */}
			<div className="mt-8 border-t pt-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{/* Stat Card 1 */}
					<div className="flex flex-col items-center rounded-lg bg-primary/10 p-4">
						<Skeleton className="font-medium text-transparent text-xs">
							Tokens Used
						</Skeleton>
						<Skeleton className="mt-2 font-bold text-3xl text-transparent">
							1,234,567
						</Skeleton>
					</div>

					{/* Stat Card 2 */}
					<div className="flex flex-col items-center rounded-lg bg-primary/10 p-4">
						<Skeleton className="font-medium text-transparent text-xs">
							Processing Cost
						</Skeleton>
						<Skeleton className="mt-2 font-bold text-3xl text-transparent">
							$123.4567
						</Skeleton>
					</div>

					{/* Stat Card 3 */}
					<div className="flex flex-col items-center rounded-lg bg-primary/10 p-4">
						<Skeleton className="font-medium text-transparent text-xs">
							Running Time
						</Skeleton>
						<Skeleton className="mt-2 font-bold text-3xl text-transparent">
							1234s
						</Skeleton>
					</div>
				</div>
			</div>

			{/* Stepper Section Skeleton */}
			<div className="mt-8 border-t pt-6">
				{/* Stepper Steps */}
				<div className="flex items-center justify-between gap-2">
					{paperStages.map((stage) => (
						<div
							key={stage}
							className="flex flex-1 flex-col items-center gap-3"
						>
							{/* Step Indicator */}
							<div className="h-12 w-12 rounded-full border-2 border-muted bg-muted" />

							{/* Connector Line */}
							<div
								className={`-mx-2 h-1 flex-1 bg-muted ${stage === 'report' ? 'opacity-0' : ''}`}
							/>

							{/* Step Content */}
							<div className="flex h-14 w-full flex-col items-center justify-center gap-1">
								<Skeleton className="font-semibold text-sm text-transparent">
									Step Label
								</Skeleton>
								<Skeleton className="text-transparent text-xs">status</Skeleton>
							</div>
						</div>
					))}
				</div>

				{/* Stepper Progress Bar */}
				<div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-4">
					<Skeleton className="font-medium text-sm text-transparent">
						Progress: 1 of 6 stages
					</Skeleton>
					<div className="h-2 w-48 overflow-hidden rounded-full bg-gray-200">
						<div className="h-full w-1/3 rounded-full bg-gray-300" />
					</div>
				</div>
			</div>
		</div>
	);
}
