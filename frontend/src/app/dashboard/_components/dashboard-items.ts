import { Book, ChartPie, Home, type LucideIcon } from 'lucide-react';

interface DashboardLink {
	title: string;
	url: string;
	icon: LucideIcon;
	hasSubmenu: boolean;
}

export const dashboardItems: DashboardLink[] = [
	{
		title: 'Home',
		url: '',
		icon: Home,
		hasSubmenu: false,
	},

	{
		title: 'Papers',
		url: 'papers',
		icon: Book,
		hasSubmenu: true,
	},

	{
		title: 'Status',
		url: 'status',
		icon: ChartPie,
		hasSubmenu: false,
	},
];

export const getDashboardItemByPath = (pathname: string) => {
	return dashboardItems.find(
		(item) =>
			(item.url !== '' && pathname.startsWith(`/dashboard/${item.url}`)) ||
			(item.url === '' && pathname === '/dashboard'),
	);
};
