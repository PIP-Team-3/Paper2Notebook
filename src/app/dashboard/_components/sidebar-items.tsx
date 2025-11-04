'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboardItems } from './dashboard-items';
import { useDashboardMobileSidebar } from './mobile-sidebar';

export function SidebarItems() {
	const pathname = usePathname();
	const { setOpen } = useDashboardMobileSidebar();

	return (
		<SidebarGroup>
			<SidebarMenu>
				{dashboardItems.map((item) => {
					const href = `/dashboard/${item.url}`;
					const isActive =
						(item.url !== '' && pathname.startsWith(href)) ||
						(item.url === '' && pathname === '/dashboard');
					return (
						<SidebarMenuItem key={item.url || 'home'}>
							<SidebarMenuButton
								asChild
								isActive={isActive}
								tooltip={item.title}
							>
								<Link
									href={href}
									className="flex items-center gap-2"
									onClick={() => setOpen(false)}
								>
									{item.icon && (
										<item.icon
											className="h-4 w-4"
											strokeWidth={isActive ? 3 : 2}
										/>
									)}
									<span className={isActive ? 'font-bold' : ''}>
										{item.title}
									</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}
