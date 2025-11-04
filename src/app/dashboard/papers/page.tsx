import { BreadcrumbSetter } from '../_components/breadcrumb-context';
import { PapersGrid } from './_components/papers-grid';
import { PapersHeader } from './_components/papers-header';
import { getAllPapers } from './_data/fetchers';

export default async function PapersPage() {
	const papers = await getAllPapers();

	return (
		<div className="w-full max-w-[1200px] p-8">
			<BreadcrumbSetter slug="" />

			<PapersHeader />

			<PapersGrid papers={papers} />
		</div>
	);
}
