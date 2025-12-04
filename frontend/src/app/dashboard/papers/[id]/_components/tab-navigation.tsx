'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
	Tabs,
	TabsList,
	TabsTrigger,
} from '../../../../../components/animate-ui/components/radix/tabs';

interface TabConfig {
	name: string;
	href: string;
}

interface TabNavigationProps {
	paperId: string;
	tabs: Record<string, TabConfig>;
}

export function TabNavigation({
	paperId,
	tabs,
}: TabNavigationProps) {
	const pathname = usePathname();
	const router = useRouter();

	const getActiveTab = () => {
		const pathSegments = pathname.split('/').filter(Boolean);
		for (const tabKey of Object.keys(tabs)) {
			if (pathSegments.includes(tabKey)) {
				return tabKey;
			}
		}
		return 'claims';
	};

	const activeTab = getActiveTab();

	const handleTabChange = (tabKey: string) => {
		const tabConfig = tabs[tabKey as keyof typeof tabs];
		if (tabConfig) {
			router.push(`/dashboard/papers/${paperId}/${tabConfig.href}`);
		}
	};

    const gridColsClass = `grid w-full grid-cols-${Object.keys(tabs).length}`;

	return (
		<Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
			<TabsList className="grid w-full grid-cols-4">
				{Object.entries(tabs).map(([tabKey, tabConfig]) => {
					return (
						<TabsTrigger
							key={tabKey}
							value={tabKey}
							className="flex items-center gap-2"
						>
							{tabConfig.name}
						</TabsTrigger>
					);
				})}
			</TabsList>
		</Tabs>
	);
}