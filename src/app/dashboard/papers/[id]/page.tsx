import { BreadcrumbSetter } from '../../_components/breadcrumb-context';
import { getStatusIcon } from '../_data/tools';
import { DetailItem } from './_components/detail-item';
import { PaperStepper } from './_components/paper-stepper';
import { StatCard } from './_components/stat-card';
import { getPaper } from './_data/fetchers';

export default async function PaperPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	try {
		const paper = await getPaper(id);

		const statusIcon = getStatusIcon(paper.status);
		const IconComponent = statusIcon.icon;

		// Helper function to format the timestamp for readability
		const formatDate = (dateString: string) => {
			// Handle cases where the timestamp might be null or malformed
			if (!dateString) return 'N/A';
			return new Date(dateString).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				timeZoneName: 'short',
			});
		};

		return (
			<>
				<BreadcrumbSetter slug={paper.title} />

				<div className="w-full max-w-[1200px] p-8">
					{/* Header: Title and Status Icon */}
					<div className="mb-6 flex items-center justify-between gap-4 border-b pb-4">
						<h1 className="font-extrabold text-2xl text-gray-900">
							{paper.title}
						</h1>
						<div className="flex items-center gap-2">
							<span
								className={`font-semibold text-sm capitalize ${statusIcon.colorClass}`}
							>
								{paper.status.replace('_', ' ')}
							</span>
							<IconComponent className={`h-6 w-6 ${statusIcon.colorClass}`} />
						</div>
					</div>

					{/* Details Grid */}
					<div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
						{/* Status */}
						<DetailItem title="Processing Status">
							<span
								className={`font-medium capitalize ${statusIcon.colorClass}`}
							>
								{paper.status}
							</span>
						</DetailItem>

						{/* Date Added */}
						<DetailItem title="Date Added">
							<time dateTime={paper.createdAt} className="text-gray-700">
								{formatDate(paper.createdAt)}
							</time>
						</DetailItem>

						{/* Paper ID (For debugging/reference) */}
						<DetailItem title="Paper ID">
							<code className="break-all rounded bg-gray-100 p-1 text-gray-600 text-sm">
								{paper.id}
							</code>
						</DetailItem>

						{/* Source URL (Conditional Rendering) */}
						{paper.sourceUrl && (
							<div className="md:col-span-2 lg:col-span-3">
								<DetailItem title="Source URL">
									<a
										href={paper.sourceUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="break-all text-blue-600 underline transition duration-150 hover:text-blue-800"
									>
										{paper.sourceUrl}
									</a>
								</DetailItem>
							</div>
						)}
					</div>

					{/* Stats Section */}
					<div className="mt-8 border-t pt-6">
						<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
							<StatCard
								label="Tokens Used"
								value={paper.stats?.tokens?.toLocaleString() ?? 'N/A'}
							/>
							<StatCard
								label="Processing Cost"
								value={`$${paper.stats?.cost?.toFixed(4) ?? 'N/A'}`}
							/>
							<StatCard
								label="Running Time"
								value={
									paper.stats?.runningTime
										? `${paper.stats.runningTime}s`
										: 'N/A'
								}
							/>
						</div>
					</div>

					{/* Stepper Section */}
					<div className="mt-8 border-t pt-6">
						<PaperStepper currentStage={paper.stage} status={paper.status} />
					</div>
				</div>
			</>
		);
	} catch (error) {
		console.error(error);
		// 🌟 404 error
		if (error instanceof Error && error.message.includes('404 Not Found')) {
			return (
				<>
					<BreadcrumbSetter slug="Not Found" />
					<div className="w-full max-w-[1200px] p-10 text-center">
						<h1 className="mb-4 font-extrabold text-4xl text-red-600">
							404 - Document Not Found
						</h1>
						<p className="mb-6 text-gray-700 text-xl">
							Cannot find paper with given ID (
							<code className="rounded bg-gray-100 p-1">{id}</code>).
						</p>
						<p className="text-gray-500">
							Check the url or return to the dashboard to view your documents.
						</p>
					</div>
				</>
			);
		}

		// Other errors
		return (
			<>
				<BreadcrumbSetter slug="Error" />
				<div className="w-full max-w-[1200px] p-10 text-center">
					<h1 className="mb-4 font-extrabold text-4xl text-red-600">
						API Error
					</h1>
					<p className="mb-6 text-gray-700 text-xl">
						An error occurred while fetching the paper details.
					</p>
					<code className="inline-block whitespace-pre-wrap rounded bg-gray-100 p-4 text-left text-gray-700 text-sm">
						{error instanceof Error ? error.message : 'Unknown error occurred'}
					</code>
				</div>
			</>
		);
	}
}
