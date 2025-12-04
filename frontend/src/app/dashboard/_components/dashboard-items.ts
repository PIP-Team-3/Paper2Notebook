import { Book, type LucideIcon } from 'lucide-react';

interface DashboardLink {
	title: string;
	url: string;
	icon: LucideIcon;
	hasSubmenu: boolean;
}

export const dashboardItems: DashboardLink[] = [
	{
		title: 'Library',
		url: '',
		icon: Book,
		hasSubmenu: false,
	},
];

export const getDashboardItemByPath = (pathname: string) => {
	// Simple match for the root dashboard path
    if (pathname === '/dashboard') {
        return dashboardItems[0];
    }
    // Check if we are in a sub-route (e.g. /dashboard/papers/...)
    // Since we only have one main item now, we can default to it or return undefined
    // Returning undefined allows the Header to handle breadcrumbs via slug/segments manually
    return undefined;
};