import {
	ArrowRight,
	BookOpen,
	Code2,
	Sparkles,
	Users,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ModulesPage() {
	return (
		<main className="min-h-screen bg-background">
			{/* Hero Section */}
			<section className="px-4 pt-32 pb-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<Link
						href="/"
						className="mb-6 inline-block text-muted-foreground text-sm transition hover:text-foreground"
					>
						← Back to Home
					</Link>

					<h1 className="mb-6 font-bold text-4xl tracking-tight sm:text-5xl">
						Extensible Module System
					</h1>

					<p className="max-w-2xl text-lg text-muted-foreground">
						Transform extracted paper information in powerful ways. Start with
						built-in modules and create your own custom processors.
					</p>
				</div>
			</section>

			{/* Available Modules */}
			<section className="bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-12 font-bold text-3xl">Available Modules</h2>

					{/* Storybook Module */}
					<div className="mb-16 grid items-center gap-8 md:grid-cols-2">
						<div>
							<div className="mb-4 inline-block">
								<span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm">
									Featured
								</span>
							</div>
							<h3 className="mb-4 font-bold text-3xl">Storybook Module</h3>
							<p className="mb-6 text-lg text-muted-foreground">
								Transform complex research papers into engaging,
								easy-to-understand children's stories. Perfect for explaining
								advanced scientific concepts in a fun and accessible way.
							</p>

							<div className="mb-8 space-y-4">
								<h4 className="font-semibold text-muted-foreground text-sm uppercase">
									What It Does
								</h4>
								<ul className="space-y-3">
									<li className="flex items-start gap-3">
										<Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
										<span className="text-sm">
											Converts academic language into simple, engaging
											narratives
										</span>
									</li>
									<li className="flex items-start gap-3">
										<Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
										<span className="text-sm">
											Creates characters and scenarios to illustrate concepts
										</span>
									</li>
									<li className="flex items-start gap-3">
										<Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
										<span className="text-sm">
											Preserves all scientific accuracy and key information
										</span>
									</li>
									<li className="flex items-start gap-3">
										<Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
										<span className="text-sm">
											Generates illustrated story with diagrams and explanations
										</span>
									</li>
									<li className="flex items-start gap-3">
										<Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
										<span className="text-sm">
											Perfect for presentations, education, and outreach
										</span>
									</li>
								</ul>
							</div>

							<div className="mb-8 space-y-4">
								<h4 className="font-semibold text-muted-foreground text-sm uppercase">
									Use Cases
								</h4>
								<ul className="space-y-2">
									<li className="flex items-center gap-2 text-sm">
										<div className="h-1.5 w-1.5 rounded-full bg-primary" />
										Science communication and public outreach
									</li>
									<li className="flex items-center gap-2 text-sm">
										<div className="h-1.5 w-1.5 rounded-full bg-primary" />
										Educational content creation
									</li>
									<li className="flex items-center gap-2 text-sm">
										<div className="h-1.5 w-1.5 rounded-full bg-primary" />
										Explaining research to non-technical audiences
									</li>
									<li className="flex items-center gap-2 text-sm">
										<div className="h-1.5 w-1.5 rounded-full bg-primary" />
										Grant writing and funding applications
									</li>
									<li className="flex items-center gap-2 text-sm">
										<div className="h-1.5 w-1.5 rounded-full bg-primary" />
										Conference presentations and talks
									</li>
								</ul>
							</div>

							<Button size="lg" asChild>
								<Link href="/dashboard">Try Storybook Module</Link>
							</Button>
						</div>

						<div className="flex min-h-96 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-8">
							<BookOpen className="h-32 w-32 text-primary/30" />
						</div>
					</div>
				</div>
			</section>

			{/* Coming Soon Modules */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-12 font-bold text-3xl">Coming Soon</h2>

					<div className="mb-8 grid gap-6 md:grid-cols-2">
						<div className="rounded-lg border border-border bg-card p-8">
							<div className="mb-4 inline-block">
								<span className="rounded-full bg-accent/50 px-3 py-1 font-medium text-accent-foreground text-xs">
									Q1 2025
								</span>
							</div>
							<h3 className="mb-3 font-semibold text-xl">
								Academic Summary Module
							</h3>
							<p className="mb-4 text-muted-foreground">
								Generate comprehensive academic summaries in multiple formats
								(abstract, brief overview, detailed analysis) with customizable
								depth and focus areas.
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>• Auto-generated abstracts</li>
								<li>• Multi-format summaries</li>
								<li>• Citation-ready outputs</li>
								<li>• Customizable depth levels</li>
							</ul>
						</div>

						<div className="rounded-lg border border-border bg-card p-8">
							<div className="mb-4 inline-block">
								<span className="rounded-full bg-accent/50 px-3 py-1 font-medium text-accent-foreground text-xs">
									Q1 2025
								</span>
							</div>
							<h3 className="mb-3 font-semibold text-xl">Comparison Module</h3>
							<p className="mb-4 text-muted-foreground">
								Compare claims, methodologies, and findings across multiple
								papers to identify patterns, contradictions, and areas of
								consensus.
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>• Side-by-side comparisons</li>
								<li>• Consensus analysis</li>
								<li>• Contradiction detection</li>
								<li>• Methodology comparison</li>
							</ul>
						</div>

						<div className="rounded-lg border border-border bg-card p-8">
							<div className="mb-4 inline-block">
								<span className="rounded-full bg-accent/50 px-3 py-1 font-medium text-accent-foreground text-xs">
									Q2 2025
								</span>
							</div>
							<h3 className="mb-3 font-semibold text-xl">
								Literature Review Assistant
							</h3>
							<p className="mb-4 text-muted-foreground">
								Automatically organize and synthesize information from multiple
								papers to create structured literature reviews with proper
								citations.
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>• Automated organization</li>
								<li>• Citation management</li>
								<li>• Theme extraction</li>
								<li>• Gap identification</li>
							</ul>
						</div>

						<div className="rounded-lg border border-border bg-card p-8">
							<div className="mb-4 inline-block">
								<span className="rounded-full bg-accent/50 px-3 py-1 font-medium text-accent-foreground text-xs">
									Q2 2025
								</span>
							</div>
							<h3 className="mb-3 font-semibold text-xl">
								Code Generation Module
							</h3>
							<p className="mb-4 text-muted-foreground">
								Generate working implementations of algorithms and methods
								described in research papers with multiple programming language
								options.
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>• Multi-language support</li>
								<li>• Algorithm implementation</li>
								<li>• Optimization tips</li>
								<li>• Usage examples</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Module Architecture */}
			<section className="bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-12 font-bold text-3xl">Module Architecture</h2>

					<div className="grid gap-6 md:grid-cols-3">
						<div className="rounded-lg border border-border bg-background p-8">
							<Code2 className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">Simple API</h3>
							<p className="text-muted-foreground text-sm">
								Build modules using our straightforward API. Take extracted data
								and produce any output format you need.
							</p>
						</div>

						<div className="rounded-lg border border-border bg-background p-8">
							<Zap className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">Lightning Fast</h3>
							<p className="text-muted-foreground text-sm">
								Optimized for performance. Modules execute efficiently and
								integrate seamlessly into the pipeline.
							</p>
						</div>

						<div className="rounded-lg border border-border bg-background p-8">
							<Users className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">Community Driven</h3>
							<p className="text-muted-foreground text-sm">
								Share your modules with the community. Discover and use modules
								created by other users.
							</p>
						</div>
					</div>

					<div className="mt-12 rounded-lg border border-border bg-background p-8">
						<h3 className="mb-4 font-bold text-2xl">
							Module Input/Output Pattern
						</h3>
						<p className="mb-6 text-muted-foreground">
							All modules receive the same structured paper analysis data and
							can output various formats:
						</p>

						<div className="grid gap-8 md:grid-cols-3">
							<div>
								<h4 className="mb-3 font-semibold text-primary text-sm">
									Input
								</h4>
								<div className="rounded-lg bg-card p-4 font-mono text-sm text-xs">
									<div className="text-muted-foreground">{`{
  claims: [...],
  methodology: {...},
  results: [...],
  datasets: {...},
  metadata: {...}
}`}</div>
								</div>
							</div>

							<div className="flex items-center justify-center">
								<ArrowRight className="h-6 w-6 text-primary" />
							</div>

							<div>
								<h4 className="mb-3 font-semibold text-primary text-sm">
									Output Options
								</h4>
								<div className="space-y-2 text-sm">
									<div className="rounded bg-card p-3">Story narrative</div>
									<div className="rounded bg-card p-3">Code snippets</div>
									<div className="rounded bg-card p-3">Visualizations</div>
									<div className="rounded bg-card p-3">Custom formats</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Create Module CTA */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl">
					<div className="rounded-lg border border-border bg-card p-8 sm:p-12">
						<h2 className="mb-4 font-bold text-3xl">Build Your Own Module</h2>
						<p className="mb-8 text-muted-foreground">
							Our module system is designed to be extensible and easy to work
							with. Create specialized processors for your specific needs and
							integrate them seamlessly.
						</p>

						<div className="mb-8 space-y-4">
							<h3 className="font-semibold">What You Can Build</h3>
							<ul className="space-y-2 text-sm">
								<li className="flex items-start gap-3">
									<div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
									<span>Custom analysis and insights</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
									<span>Domain-specific processors</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
									<span>Integration with external services</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
									<span>Custom output formats</span>
								</li>
							</ul>
						</div>

						<Button size="lg" disabled>
							View Developer Docs (Coming Soon)
						</Button>
					</div>
				</div>
			</section>
		</main>
	);
}
