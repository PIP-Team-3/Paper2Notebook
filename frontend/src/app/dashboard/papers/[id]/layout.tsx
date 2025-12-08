import type { ReactNode } from 'react';
import { BreadcrumbSetter } from '../../_components/breadcrumb-context';
import { getStatusIcon } from '../_data/tools';
import { DetailItem } from './_components/detail-item';
import { TabNavigation } from './_components/tab-navigation';
import { getPaper } from './_data/fetchers';

interface LayoutProps {
	children: ReactNode;
	params: Promise<{ id: string }>;
}

const TABS = {
	claims: { name: 'Claims', href: 'claims' },
	plans: { name: 'Plans', href: 'plans' },
	modules: { name: 'Modules', href: 'modules' },
	settings: { name: 'Settings', href: 'settings' },
};

export default async function PaperLayout({ children, params }: LayoutProps) {
	const { id } = await params;

	try {
		const paper = await getPaper(id);
		const statusIcon = getStatusIcon(paper.status);
		const IconComponent = statusIcon.icon;

		const formatDate = (dateString: string | null) => {
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
						{paper.createdAt && (
							<DetailItem title="Date Added">
								<time dateTime={paper.createdAt} className="text-gray-700">
									{formatDate(paper.createdAt)}
								</time>
							</DetailItem>
						)}

						{/* Paper ID */}
						<DetailItem title="Paper ID">
							<code className="break-all rounded bg-gray-100 p-1 text-gray-600 text-sm">
								{paper.id}
							</code>
						</DetailItem>

						{/* Source URL */}
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

					{/* --- Stats Section Removed Here --- */}

					{/* Tab Navigation */}
					<div className="mt-8">
						<TabNavigation paperId={paper.id} tabs={TABS} />
					</div>

					{/* Tab Content */}
					<div className="mt-6">{children}</div>
				</div>
			</>
		);
	} catch (error) {
		console.error(error);
		if (error instanceof Error && error.message.includes('404 Not Found')) {
			return (
				<>
					<BreadcrumbSetter slug="Not Found" />
					<div className="w-full max-w-[1200px] p-10 text-center">
						<h1 className="mb-4 font-extrabold text-4xl text-red-600">
							404 - Document Not Found
						</h1>
						{/* ... */}
					</div>
				</>
			);
		}
		return <div>Error loading paper</div>;
	}
}
