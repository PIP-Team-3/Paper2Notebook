'use client';
import { BookOpen, Menu, SlashIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '../../../components/ui/breadcrumb';
import { Button } from '../../../components/ui/button';
import { useIsMobile } from '../../../hooks/use-mobile';
import { useBreadcrumb } from './breadcrumb-context';
import { getDashboardItemByPath } from './dashboard-items';
import { useDashboardMobileSidebar } from './mobile-sidebar';

export function Header() {
	const url = usePathname();
	const currentItem = getDashboardItemByPath(url);
	const { slug } = useBreadcrumb();
	const isMobile = useIsMobile();
	const { setOpen } = useDashboardMobileSidebar();

	return (
		<header className="sticky top-0 z-40 flex h-12 w-full flex-shrink-0 items-center justify-between gap-4 border-b bg-background px-2">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link
								href="/dashboard"
								className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-300/50 backdrop-blur-sm"
							>
								<BookOpen className="size-4 text-blue-700" />
							</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>

					<BreadcrumbSeparator>
						<SlashIcon />
					</BreadcrumbSeparator>

					{currentItem?.hasSubmenu && slug ? (
						<>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link href={`/dashboard/${currentItem.url}`}>
										{currentItem.title}
									</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator>
								<SlashIcon />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
								<BreadcrumbPage>{slug}</BreadcrumbPage>
							</BreadcrumbItem>
						</>
					) : (
						<BreadcrumbItem>
							<BreadcrumbPage>{currentItem?.title}</BreadcrumbPage>
						</BreadcrumbItem>
					)}
				</BreadcrumbList>
			</Breadcrumb>

			{isMobile && (
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setOpen(true)}
					className="md:hidden"
				>
					<Menu className="h-5 w-5" />
				</Button>
			)}
		</header>
	);
}
