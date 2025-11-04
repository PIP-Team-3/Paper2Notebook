import { ArrowRight, BookOpen, Boxes, FileText, Zap } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function FeatureCardBlue({
	icon,
	title,
	description,
	highlight = false,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	highlight?: boolean;
}) {
	return (
		<div
			className={`rounded-lg border p-6 transition-all ${
				highlight
					? 'border-primary/30 bg-primary/10'
					: 'border-border bg-card hover:border-primary/20 hover:shadow-md'
			}`}
		>
			<div
				className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${
					highlight ? 'bg-primary/20' : 'bg-primary/10'
				}`}
			>
				<div className="text-primary">{icon}</div>
			</div>
			<h3 className="mb-2 font-semibold text-lg">{title}</h3>
			<p
				className={`text-sm ${
					highlight ? 'text-foreground' : 'text-muted-foreground'
				}`}
			>
				{description}
			</p>
		</div>
	);
}

export default function Home() {
	return (
		<main className="w-full bg-background">
			{/* Hero Section */}
			<section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 px-4 pt-32 pb-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl text-center">
					<div className="mb-6 inline-block">
						<span className="rounded-full bg-primary/15 px-3 py-1 font-medium text-primary text-sm">
							🚀 AI-Powered Paper Analysis
						</span>
					</div>

					<h1 className="mb-6 font-bold text-4xl tracking-tight sm:text-5xl lg:text-6xl">
						Transform Research Papers
						<span className="text-primary"> Into Interactive Notebooks</span>
					</h1>

					<p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
						Upload your research paper and let AI agents extract key claims,
						create mock datasets, and generate Jupyter notebooks to test
						everything. All in one platform.
					</p>

					<div className="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
						<Button size="lg" asChild>
							<Link href="/dashboard" className="gap-2">
								Get Started <ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
						<Button variant="outline" size="lg" asChild>
							<Link href="/how-it-works">See How It Works</Link>
						</Button>
					</div>

					{/* Hero Image Placeholder */}
					<div className="mx-auto rounded-lg border border-primary/20 bg-gradient-to-br from-primary/20 to-primary/5 p-12 shadow-sm">
						<div className="flex h-full items-center justify-center">
							<FileText className="h-32 w-32 text-primary/30" />
						</div>
					</div>
				</div>
			</section>

			{/* Features Overview Section */}
			<section className="bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 font-bold text-3xl sm:text-4xl">
							Powerful Features
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
							Everything you need to understand, test, and validate research
							papers
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<FeatureCardBlue
							icon={<Zap className="h-6 w-6" />}
							title="AI-Powered Extraction"
							description="Advanced AI agents automatically extract claims, methodologies, and key findings from research papers in seconds."
							highlight={true}
						/>

						<FeatureCardBlue
							icon={<BookOpen className="h-6 w-6" />}
							title="Auto-Generated Notebooks"
							description="Get Python Jupyter notebooks with mock datasets to test and validate every claim from the paper."
						/>

						<FeatureCardBlue
							icon={<Boxes className="h-6 w-6" />}
							title="Extensible Modules"
							description="Add custom modules to process extracted information. Start with Storybook and build more."
						/>

						<FeatureCardBlue
							icon={<FileText className="h-6 w-6" />}
							title="Comprehensive Analysis"
							description="Get detailed reports with structured data, mock results, and interactive visualizations."
						/>
					</div>

					<div className="mt-12 text-center">
						<Button size="lg" asChild>
							<Link href="/features" className="gap-2">
								Explore All Features <ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* Modules Section */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 font-bold text-3xl sm:text-4xl">
							Extensible Module System
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
							Start with our powerful modules and create your own
						</p>
					</div>

					<div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/10 to-background p-8">
						<div className="flex flex-col gap-8 md:flex-row">
							<div className="flex-1">
								<div className="mb-4 inline-block">
									<span className="rounded-full bg-primary/15 px-3 py-1 font-medium text-primary text-xs">
										Featured
									</span>
								</div>
								<h3 className="mb-4 font-bold text-2xl">Storybook Module</h3>
								<p className="mb-6 text-muted-foreground">
									Transform complex research papers into engaging children's
									stories. Perfect for explaining advanced concepts in an
									accessible way to anyone, regardless of their background.
								</p>
								<ul className="mb-6 space-y-3">
									<li className="flex items-center gap-3">
										<span className="h-2 w-2 rounded-full bg-primary" />
										<span className="text-sm">Simplify complex concepts</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="h-2 w-2 rounded-full bg-primary" />
										<span className="text-sm">Create engaging narratives</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="h-2 w-2 rounded-full bg-primary" />
										<span className="text-sm">Perfect for presentations</span>
									</li>
									<li className="flex items-center gap-3">
										<span className="h-2 w-2 rounded-full bg-primary" />
										<span className="text-sm">
											Preserve all key information
										</span>
									</li>
								</ul>
								<Button asChild>
									<Link href="/modules">Learn More</Link>
								</Button>
							</div>
							<div className="flex min-h-64 flex-1 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-8">
								<BookOpen className="h-24 w-24 text-primary/30" />
							</div>
						</div>
					</div>

					<div className="mt-8 grid gap-6 md:grid-cols-2">
						<div className="rounded-lg border border-border bg-card p-6">
							<h4 className="mb-2 font-semibold">More Modules Coming Soon</h4>
							<p className="mb-4 text-muted-foreground text-sm">
								We're working on additional modules to expand the capabilities
								of Paper2Notebook.
							</p>
							<Button variant="outline" size="sm" asChild>
								<Link href="/modules">See Roadmap</Link>
							</Button>
						</div>
						<div className="rounded-lg border border-border bg-card p-6">
							<h4 className="mb-2 font-semibold">Build Your Own Module</h4>
							<p className="mb-4 text-muted-foreground text-sm">
								Our plugin system makes it easy to create custom modules for
								your specific needs.
							</p>
							<Button variant="outline" size="sm" disabled>
								Developer Docs (Coming Soon)
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="mb-12 text-center">
						<h2 className="mb-4 font-bold text-3xl sm:text-4xl">
							How It Works
						</h2>
						<p className="mx-auto max-w-2xl text-lg text-muted-foreground">
							Four simple steps to analyze any research paper
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-4">
						{[
							{
								step: 1,
								title: 'Upload Paper',
								description:
									'Simply upload your PDF or paste the paper content',
							},
							{
								step: 2,
								title: 'AI Extraction',
								description:
									'Our AI agents extract claims, findings, and methodologies',
							},
							{
								step: 3,
								title: 'Generate Notebook',
								description: 'Automatic Jupyter notebook with mock datasets',
							},
							{
								step: 4,
								title: 'Apply Modules',
								description:
									'Use modules to create additional insights and content',
							},
						].map((item) => (
							<div key={item.step} className="text-center">
								<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
									{item.step}
								</div>
								<h3 className="mb-2 font-semibold">{item.title}</h3>
								<p className="text-muted-foreground text-sm">
									{item.description}
								</p>
							</div>
						))}
					</div>

					<div className="mt-12 text-center">
						<Button size="lg" asChild>
							<Link href="/how-it-works" className="gap-2">
								See Detailed Process <ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="mb-4 font-bold text-3xl sm:text-4xl">
						Ready to Transform Your Research?
					</h2>
					<p className="mb-8 text-lg text-muted-foreground">
						Start analyzing research papers with AI agents in minutes. No credit
						card required.
					</p>
					<Button size="lg" asChild>
						<Link href="/dashboard" className="gap-2">
							Get Started Now <ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</section>
		</main>
	);
}
