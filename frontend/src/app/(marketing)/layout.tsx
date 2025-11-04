import type { ReactNode } from 'react';
import { Footer } from './_components/footer';
import { Navbar } from './_components/navbar';

export default function MarketingLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<>
			<Navbar />
			{children}
			<Footer />
		</>
	);
}
