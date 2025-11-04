'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarItems } from './sidebar-items';

interface DashboardMobileSidebarContextType {
	open: boolean;
	setOpen: (open: boolean) => void;
}

const DashboardMobileSidebarContext = createContext<
	DashboardMobileSidebarContextType | undefined
>(undefined);

export function DashboardMobileSidebarProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);

	return (
		<DashboardMobileSidebarContext.Provider value={{ open, setOpen }}>
			{children}
		</DashboardMobileSidebarContext.Provider>
	);
}

export function useDashboardMobileSidebar() {
	const context = useContext(DashboardMobileSidebarContext);
	if (!context) {
		throw new Error(
			'useDashboardMobileSidebar must be used within DashboardMobileSidebarProvider',
		);
	}
	return context;
}

export function MobileSidebar() {
	const isMobile = useIsMobile();
	const { open, setOpen } = useDashboardMobileSidebar();

	if (!isMobile) {
		return null;
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent
				side="bottom"
				className="h-fit w-full bg-sidebar p-0 pb-8 text-sidebar-foreground [&>button]:hidden"
			>
				<SheetHeader className="sr-only">
					<SheetTitle>Sidebar</SheetTitle>
					<SheetDescription>Displays the mobile sidebar.</SheetDescription>
				</SheetHeader>
				<div className="flex w-full flex-col">
					<SidebarItems />
				</div>
			</SheetContent>
		</Sheet>
	);
}
