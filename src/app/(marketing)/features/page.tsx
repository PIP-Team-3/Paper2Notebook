import {
	ArrowRight,
	BarChart3,
	BookOpen,
	Boxes,
	Clock,
	Cpu,
	FileText,
	Shield,
	Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '../_components/feature-card';

export default function FeaturesPage() {
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
						Powerful Features for
						<span className="text-primary"> Research Paper Analysis</span>
					</h1>

					<p className="max-w-2xl text-lg text-muted-foreground">
						Everything you need to understand, validate, and build upon research
						papers with cutting-edge AI technology.
					</p>
				</div>
			</section>

			{/* Core Features */}
			<section className="bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="mb-12">
						<h2 className="mb-4 font-bold text-3xl">Core Features</h2>
						<p className="text-muted-foreground">
							Comprehensive tools for paper analysis and validation
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<FeatureCard
							icon={<Zap className="h-6 w-6 text-primary" />}
							title="AI Claim Extraction"
							description="Automatically identify and extract all major claims from research papers with high accuracy."
							highlight
						/>

						<FeatureCard
							icon={<Cpu className="h-6 w-6" />}
							title="Methodology Analysis"
							description="Our AI parses and explains the methodologies used in papers for deep understanding."
						/>

						<FeatureCard
							icon={<BarChart3 className="h-6 w-6" />}
							title="Results Visualization"
							description="Visualize paper findings and results in interactive charts and graphs."
						/>

						<FeatureCard
							icon={<BookOpen className="h-6 w-6" />}
							title="Jupyter Notebook Generation"
							description="Automatically generate Python Jupyter notebooks with mock datasets to test claims."
						/>

						<FeatureCard
							icon={<Boxes className="h-6 w-6" />}
							title="Mock Dataset Creation"
							description="Get realistic mock datasets that follow the patterns and characteristics of the paper."
						/>

						<FeatureCard
							icon={<FileText className="h-6 w-6" />}
							title="Comprehensive Reports"
							description="Structured reports with extracted data, analysis, and interactive insights."
						/>
					</div>
				</div>
			</section>

			{/* Detailed Features */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-12 font-bold text-3xl">Detailed Capabilities</h2>

					{/* AI Extraction */}
					<div className="mb-16 grid items-center gap-8 md:grid-cols-2">
						<div>
							<h3 className="mb-4 font-bold text-2xl">
								AI-Powered Information Extraction
							</h3>
							<p className="mb-6 text-muted-foreground">
								Our advanced AI agents understand the nuances of academic
								writing and extract:
							</p>
							<ul className="mb-8 space-y-3">
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Primary research claims and hypotheses
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Experimental methodologies and procedures
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Key findings and statistical results
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Dependencies between experiments
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">Limitations and future work</span>
								</li>
							</ul>
						</div>
						<div className="flex min-h-96 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-8">
							<Zap className="h-32 w-32 text-primary/30" />
						</div>
					</div>

					{/* Mock Datasets */}
					<div className="mb-16 grid items-center gap-8 md:grid-cols-2">
						<div className="flex min-h-96 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-8 md:order-2">
							<BookOpen className="h-32 w-32 text-primary/30" />
						</div>
						<div className="md:order-1">
							<h3 className="mb-4 font-bold text-2xl">
								Auto-Generated Mock Datasets
							</h3>
							<p className="mb-6 text-muted-foreground">
								Create realistic datasets that match your paper's
								characteristics:
							</p>
							<ul className="mb-8 space-y-3">
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Distribution patterns matching paper data
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Statistical properties preserved
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Multiple dataset variations available
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">Ready to use in experiments</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Privacy-preserving synthetic data
									</span>
								</li>
							</ul>
						</div>
					</div>

					{/* Jupyter Notebooks */}
					<div className="mb-16 grid items-center gap-8 md:grid-cols-2">
						<div>
							<h3 className="mb-4 font-bold text-2xl">
								Ready-to-Run Jupyter Notebooks
							</h3>
							<p className="mb-6 text-muted-foreground">
								Get complete, executable Python notebooks with:
							</p>
							<ul className="mb-8 space-y-3">
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Implementation of paper methodologies
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">Test cases for each claim</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">Data visualizations and plots</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Result validation and comparison
									</span>
								</li>
								<li className="flex items-start gap-3">
									<div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
									<span className="text-sm">
										Fully commented and documented code
									</span>
								</li>
							</ul>
						</div>
						<div className="flex min-h-96 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-8">
							<FileText className="h-32 w-32 text-primary/30" />
						</div>
					</div>
				</div>
			</section>

			{/* Additional Features */}
			<section className="bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-12 font-bold text-3xl">Additional Capabilities</h2>

					<div className="grid gap-6 md:grid-cols-2">
						<div className="rounded-lg border border-border bg-background p-8">
							<Clock className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">
								Lightning Fast Processing
							</h3>
							<p className="text-muted-foreground">
								Analyze papers in seconds, not hours. Our optimized AI pipeline
								delivers results instantly.
							</p>
						</div>

						<div className="rounded-lg border border-border bg-background p-8">
							<Shield className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">Privacy First</h3>
							<p className="text-muted-foreground">
								Your papers and data are private. We don't store or use your
								content for training.
							</p>
						</div>

						<div className="rounded-lg border border-border bg-background p-8">
							<Boxes className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">
								Extensible Architecture
							</h3>
							<p className="text-muted-foreground">
								Add custom modules to extend functionality. Create specialized
								processors for your use cases.
							</p>
						</div>

						<div className="rounded-lg border border-border bg-background p-8">
							<BarChart3 className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">Rich Analytics</h3>
							<p className="text-muted-foreground">
								Get detailed statistics and insights about paper contents and
								analysis results.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="mb-4 font-bold text-3xl">
						Experience These Features Today
					</h2>
					<p className="mb-8 text-lg text-muted-foreground">
						Start analyzing research papers with our powerful AI agents.
					</p>
					<Button size="lg" asChild>
						<Link href="/dashboard" className="gap-2">
							Get Started <ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</section>
		</main>
	);
}
