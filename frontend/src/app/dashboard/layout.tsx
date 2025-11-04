import type { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar';
import { BreadcrumbProvider } from './_components/breadcrumb-context';
import { DashboardSidebar } from './_components/dashboard-sidebar';
import { Header } from './_components/header';
import {
	DashboardMobileSidebarProvider,
	MobileSidebar,
} from './_components/mobile-sidebar';

export default function DashboardLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return (
		<BreadcrumbProvider>
			<DashboardMobileSidebarProvider>
				<SidebarProvider className="flex flex-col">
					<Header />
					<MobileSidebar />
					<div className="flex flex-1">
						<DashboardSidebar />
						<SidebarInset>
							<div className="flex flex-1 flex-col items-center">
								{children}
							</div>
						</SidebarInset>
					</div>
				</SidebarProvider>
			</DashboardMobileSidebarProvider>
		</BreadcrumbProvider>
	);
}
