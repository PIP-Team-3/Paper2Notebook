'use client';

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { SidebarItems } from './sidebar-items';

export function DashboardSidebar() {
	return (
		<Sidebar
			collapsible="icon"
			className="top-12 h-[calc(100svh-calc(--spacing(12)))]!"
			style={{ '--sidebar-width': '14rem' } as React.CSSProperties}
		>
			<SidebarContent>
				<SidebarItems />
			</SidebarContent>

			<SidebarFooter>
				<SidebarTrigger />
			</SidebarFooter>
		</Sidebar>
	);
}
