import { BreadcrumbSetter } from './_components/breadcrumb-context';
import { PapersGrid } from './papers/_components/papers-grid';
import { PapersHeader } from './papers/_components/papers-header';
import { getAllPapers } from './papers/_data/fetchers';

// Skip static pre-rendering - fetch data at runtime
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
	const papers = await getAllPapers();

	return (
		<div className="w-full max-w-[1200px] p-8">
			<BreadcrumbSetter slug="" />

			<PapersHeader />

			<PapersGrid papers={papers} />
		</div>
	);
}
