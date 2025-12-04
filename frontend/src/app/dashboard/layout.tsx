import type { ReactNode } from 'react';
import { BreadcrumbProvider } from './_components/breadcrumb-context';
import { Header } from './_components/header';

export default function DashboardLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<BreadcrumbProvider>
			{/* Standard flex column layout: Header on top, Content below */}
			<div className="flex min-h-screen flex-col bg-background">
				<Header />
				<main className="flex-1">
					<div className="mx-auto max-w-7xl">
						{children}
					</div>
				</main>
			</div>
		</BreadcrumbProvider>
	);
}