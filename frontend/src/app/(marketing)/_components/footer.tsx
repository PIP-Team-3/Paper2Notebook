import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
	return (
		<footer className="border-border border-t bg-card">
			<div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-4">
					<div>
						<h3 className="mb-4 font-semibold text-sm">Product</h3>
						<ul className="space-y-2">
							<li>
								<Link
									href="/features"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Features
								</Link>
							</li>
							<li>
								<Link
									href="/modules"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Modules
								</Link>
							</li>
							<li>
								<Link
									href="/how-it-works"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									How It Works
								</Link>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="mb-4 font-semibold text-sm">Resources</h3>
						<ul className="space-y-2">
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Documentation
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Blog
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Community
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="mb-4 font-semibold text-sm">Company</h3>
						<ul className="space-y-2">
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									About
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Contact
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Privacy
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="mb-4 font-semibold text-sm">Connect</h3>
						<ul className="space-y-2">
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Twitter
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									GitHub
								</a>
							</li>
							<li>
								<a
									href="#"
									className="text-muted-foreground text-sm transition hover:text-foreground"
								>
									Discord
								</a>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-border border-t pt-8">
					<div className="flex flex-col items-center justify-between gap-4 md:flex-row">
						<div className="flex items-center gap-2">
							<div className="flex size-6 items-center justify-center rounded-lg bg-blue-300/50 backdrop-blur-sm">
								<BookOpen className="size-4 text-blue-700" />
							</div>
							<span className="font-semibold">Paper2Notebook</span>
						</div>
						<p className="text-center text-muted-foreground text-sm md:text-right">
							© 2024 Paper2Notebook. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
