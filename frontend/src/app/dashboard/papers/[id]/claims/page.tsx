import { getClaims } from '../_data/fetchers';
import { ClaimsPageClient } from './_components/claims-page-client';

interface ClaimsPageProps {
	params: Promise<{ id: string }>;
}

export default async function ClaimsPage({ params }: ClaimsPageProps) {
	const { id } = await params;
	const paperId = id;

	let claims: unknown[] = [];

	try {
		claims = await getClaims(paperId);
	} catch (err) {
		console.error('Error fetching claims:', err);
		// Don't fail the page if claims fetch fails - just show empty state
		claims = [];
	}

	return <ClaimsPageClient paperId={paperId} initialClaims={claims as any} />;
}
