'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface BreadcrumbContextType {
	slug: string | null;
	setSlug: (slug: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
	undefined,
);

export function BreadcrumbProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [slug, setSlug] = useState<string | null>(null);

	return (
		<BreadcrumbContext.Provider value={{ slug, setSlug }}>
			{children}
		</BreadcrumbContext.Provider>
	);
}

export function useBreadcrumb() {
	const context = useContext(BreadcrumbContext);
	if (!context) {
		throw new Error('useBreadcrumb must be used within BreadcrumbProvider');
	}
	return context;
}

export function BreadcrumbSetter({ slug }: { slug: string }) {
	const { setSlug } = useBreadcrumb();
	useEffect(() => {
		setSlug(slug);
	}, [slug, setSlug]);
	return null;
}
