'use client';
import { BookOpen, SlashIcon } from 'lucide-react';
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
import { useBreadcrumb } from './breadcrumb-context';

export function Header() {
	const pathname = usePathname();
	const { slug } = useBreadcrumb();

	// Parse path for breadcrumbs
	const segments = pathname.split('/').filter(Boolean);
	const isPaperRoute = segments.length >= 3 && segments[1] === 'papers';
    const currentTab = isPaperRoute && segments[3] ? segments[3] : null;
    const tabName = currentTab ? currentTab.charAt(0).toUpperCase() + currentTab.slice(1) : '';

	return (
		<header className="sticky top-0 z-40 flex h-14 w-full items-center border-b bg-background px-6">
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink asChild>
							<Link
								href="/dashboard"
								className="flex items-center gap-2 font-semibold"
							>
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<BookOpen className="size-4" />
								</div>
                                <span>Library</span>
							</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>

					{isPaperRoute && slug && (
						<>
							<BreadcrumbSeparator>
								<SlashIcon />
							</BreadcrumbSeparator>
							<BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link href={`/dashboard/papers/${segments[2]}`}>
									    {slug}
                                    </Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
						</>
					)}

                    {isPaperRoute && tabName && (
                        <>
                            <BreadcrumbSeparator>
								<SlashIcon />
							</BreadcrumbSeparator>
                            <BreadcrumbItem>
								<BreadcrumbPage>{tabName}</BreadcrumbPage>
							</BreadcrumbItem>
                        </>
                    )}
				</BreadcrumbList>
			</Breadcrumb>
		</header>
	);
}