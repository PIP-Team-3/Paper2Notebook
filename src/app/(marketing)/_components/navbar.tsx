'use client';

import { BookOpen, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function Navbar() {
	const pathname = usePathname();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const isActive = (href: string) => {
		return href === '/' ? pathname === '/' : pathname.startsWith(href);
	};

	const navLinks = [
		{ href: '/features', label: 'Features' },
		{ href: '/modules', label: 'Modules' },
		{ href: '/how-it-works', label: 'How It Works' },
	];

	return (
		<>
			<nav className="fixed top-0 right-0 left-0 z-50 border-border border-b bg-background/80 backdrop-blur-md">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						<Link href="/" className="flex items-center gap-2">
							<div className="flex size-8 items-center justify-center rounded-lg bg-blue-300/50 backdrop-blur-sm">
								<BookOpen className="size-4 text-blue-700" />
							</div>
							<span className="hidden font-bold text-lg sm:inline">
								Paper2Notebook
							</span>
						</Link>

						{/* Desktop Navigation */}
						<div className="hidden items-center gap-2 md:flex">
							{navLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className={`rounded-md px-3 py-2 text-sm transition ${
										isActive(link.href)
											? 'bg-muted font-medium text-foreground'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									{link.label}
								</Link>
							))}
						</div>

						<div className="flex items-center gap-3">
							<Button size="sm" asChild className="hidden sm:flex">
								<Link href="/dashboard">Dashboard</Link>
							</Button>

							{/* Mobile Menu Button */}
							<button
								type="button"
								className="rounded-md p-2 transition hover:bg-accent md:hidden"
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								aria-label="Toggle menu"
							>
								<Menu className="h-5 w-5" />
							</button>
						</div>
					</div>
				</div>
			</nav>

			{/* Mobile Navigation - Outside nav to avoid background stacking */}
			{mobileMenuOpen && (
				<div className="fixed top-16 right-0 left-0 z-40 animate-slide-down border-border border-b bg-background/50 backdrop-blur-2xl md:hidden">
					<div className="mx-auto max-w-7xl space-y-3 px-4 py-4 sm:px-6 lg:px-8">
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setMobileMenuOpen(false)}
								className={`block rounded-md px-3 py-2 text-sm transition ${
									isActive(link.href)
										? 'bg-muted font-medium text-foreground'
										: 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
								}`}
							>
								{link.label}
							</Link>
						))}
						<Button asChild className="w-full">
							<Link href="/dashboard">Go to Dashboard</Link>
						</Button>
					</div>
				</div>
			)}
		</>
	);
}
