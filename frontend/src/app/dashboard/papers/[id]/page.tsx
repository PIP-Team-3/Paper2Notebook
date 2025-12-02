import { redirect } from 'next/navigation';

export default async function PaperDefaultPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	// Redirect to claims tab by default
	redirect(`/dashboard/papers/${id}/claims`);
}
