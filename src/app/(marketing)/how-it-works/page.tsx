import {
	ArrowRight,
	BarChart3,
	Brain,
	CheckCircle2,
	Code,
	FileJson,
	Sparkles,
	Upload,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HowItWorksPage() {
	const steps = [
		{
			number: 1,
			title: 'Upload Your Paper',
			description:
				'Upload a research paper as a PDF or paste the text directly into Paper2Notebook.',
			icon: Upload,
			details: [
				'Supports PDF, text, and markdown formats',
				'Automatic format detection and parsing',
				'Preview before processing',
			],
		},
		{
			number: 2,
			title: 'AI Extracts Information',
			description:
				'Our AI agents analyze the paper and extract key information including claims, methodologies, and results.',
			icon: Brain,
			details: [
				'Identifies primary and secondary claims',
				'Extracts experimental methodologies',
				'Captures quantitative and qualitative findings',
			],
		},
		{
			number: 3,
			title: 'Generate Notebook',
			description:
				'Automatically create a Python Jupyter notebook with mock datasets and test cases for each claim.',
			icon: Code,
			details: [
				'Auto-generated test implementations',
				'Mock datasets matching paper characteristics',
				'Visualization and analysis code',
			],
		},
		{
			number: 4,
			title: 'Apply Modules',
			description:
				'Extend the analysis with specialized modules like Storybook to create additional insights.',
			icon: Sparkles,
			details: [
				'Storybook: Create simple story explanations',
				'Comparison: Compare with other papers',
				'Summary: Generate abstracts and overviews',
			],
		},
		{
			number: 5,
			title: 'Get Comprehensive Results',
			description:
				'Receive structured reports with all extracted data, analysis results, and module outputs.',
			icon: FileJson,
			details: [
				'Structured JSON/CSV exports',
				'Interactive web dashboard',
				'Downloadable reports',
			],
		},
		{
			number: 6,
			title: 'Test & Validate',
			description:
				"Use the generated notebook to test the paper's claims with mock data and your own datasets.",
			icon: CheckCircle2,
			details: [
				'Run experiments in Jupyter',
				'Compare with original results',
				'Identify supporting or contradicting evidence',
			],
		},
	];

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
						How Paper2Notebook Works
					</h1>

					<p className="max-w-2xl text-lg text-muted-foreground">
						A six-step process to transform research papers into interactive
						analysis tools powered by AI.
					</p>
				</div>
			</section>

			{/* Process Steps */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="space-y-12">
						{steps.map((step, index) => {
							const Icon = step.icon;
							const isEven = index % 2 === 0;

							return (
								<div key={step.number}>
									<div
										className={`grid items-center gap-8 md:grid-cols-2 ${
											!isEven && 'md:grid-flow-dense'
										}`}
									>
										<div className={!isEven ? 'md:order-2' : ''}>
											<div className="mb-4 flex items-center gap-4">
												<div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
													{step.number}
												</div>
												<Icon className="h-8 w-8 text-primary" />
											</div>

											<h2 className="mb-4 font-bold text-3xl">{step.title}</h2>
											<p className="mb-6 text-lg text-muted-foreground">
												{step.description}
											</p>

											<div className="space-y-2">
												<h3 className="mb-3 font-semibold text-muted-foreground text-sm uppercase">
													Key Features
												</h3>
												<ul className="space-y-2">
													{step.details.map((detail, i) => (
														<li key={i} className="flex items-start gap-3">
															<CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
															<span className="text-sm">{detail}</span>
														</li>
													))}
												</ul>
											</div>
										</div>

										<div
											className={`flex min-h-64 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-8 ${
												!isEven ? 'md:order-1' : ''
											}`}
										>
											<Icon className="h-32 w-32 text-primary/30" />
										</div>
									</div>

									{index < steps.length - 1 && (
										<div className="my-12 flex justify-center">
											<div className="flex flex-col items-center gap-2">
												<ArrowRight className="h-6 w-6 rotate-90 text-muted-foreground" />
												<span className="font-medium text-muted-foreground text-xs">
													Next
												</span>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* Data Flow Diagram */}
			<section className="bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-12 text-center font-bold text-3xl">
						Data Flow Architecture
					</h2>

					<div className="overflow-x-auto rounded-lg border border-border bg-background p-8">
						<div className="min-w-max">
							<div className="flex items-center justify-between gap-4">
								{[
									{
										label: 'Paper Upload',
										icon: '📄',
									},
									{ label: 'AI Parsing', icon: '🧠' },
									{
										label: 'Extraction',
										icon: '⚙️',
									},
									{
										label: 'Generation',
										icon: '✨',
									},
									{
										label: 'Modules',
										icon: '🔧',
									},
									{
										label: 'Results',
										icon: '📊',
									},
								].map((item, index) => (
									<div key={item.label}>
										<div className="flex flex-col items-center">
											<div className="mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-2xl">
												{item.icon}
											</div>
											<div className="whitespace-nowrap text-center font-medium text-sm">
												{item.label}
											</div>
										</div>
										{index < 5 && (
											<div className="mx-2 hidden md:block">
												<ArrowRight className="h-6 w-6 text-muted-foreground" />
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="mt-12 grid gap-8 md:grid-cols-2">
						<div className="rounded-lg border border-border bg-background p-8">
							<h3 className="mb-4 font-semibold text-xl">Input Processing</h3>
							<p className="mb-4 text-muted-foreground text-sm">
								Your paper goes through intelligent parsing:
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-start gap-2">
									<span className="font-bold text-primary">•</span>
									<span>Format detection (PDF, text, markdown)</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="font-bold text-primary">•</span>
									<span>Structural analysis (sections, references)</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="font-bold text-primary">•</span>
									<span>Content normalization and cleaning</span>
								</li>
							</ul>
						</div>

						<div className="rounded-lg border border-border bg-background p-8">
							<h3 className="mb-4 font-semibold text-xl">AI Processing</h3>
							<p className="mb-4 text-muted-foreground text-sm">
								Advanced agents extract and understand:
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-start gap-2">
									<span className="font-bold text-primary">•</span>
									<span>Research claims and hypotheses</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="font-bold text-primary">•</span>
									<span>Experimental procedures and datasets</span>
								</li>
								<li className="flex items-start gap-2">
									<span className="font-bold text-primary">•</span>
									<span>Results and implications</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Output Options */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-12 font-bold text-3xl">Output & Deliverables</h2>

					<div className="grid gap-6 md:grid-cols-3">
						<div className="rounded-lg border border-border bg-card p-8">
							<FileJson className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">Structured Data</h3>
							<p className="mb-4 text-muted-foreground text-sm">
								Get all extracted information in structured formats:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>• JSON/CSV exports</li>
								<li>• Database schemas</li>
								<li>• API access</li>
							</ul>
						</div>

						<div className="rounded-lg border border-border bg-card p-8">
							<Code className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">Jupyter Notebooks</h3>
							<p className="mb-4 text-muted-foreground text-sm">
								Ready-to-run Python notebooks with:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>• Implementation code</li>
								<li>• Mock datasets</li>
								<li>• Visualizations</li>
							</ul>
						</div>

						<div className="rounded-lg border border-border bg-card p-8">
							<BarChart3 className="mb-4 h-8 w-8 text-primary" />
							<h3 className="mb-3 font-semibold text-xl">Analysis Reports</h3>
							<p className="mb-4 text-muted-foreground text-sm">
								Comprehensive reports including:
							</p>
							<ul className="space-y-2 text-muted-foreground text-sm">
								<li>• Claims summary</li>
								<li>• Module outputs</li>
								<li>• Test results</li>
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Typical Workflow */}
			<section className="bg-card/50 px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<h2 className="mb-12 font-bold text-3xl">Typical Workflow Example</h2>

					<div className="space-y-6">
						<div className="rounded-lg border border-border bg-background p-6">
							<div className="flex items-start gap-4">
								<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
									1
								</div>
								<div>
									<h3 className="mb-2 font-semibold">
										Day 1: Upload and Process
									</h3>
									<p className="text-muted-foreground text-sm">
										You upload a machine learning research paper on neural
										networks. Paper2Notebook processes it in seconds and
										extracts 15 main claims and 3 experimental methodologies.
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-border bg-background p-6">
							<div className="flex items-start gap-4">
								<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
									2
								</div>
								<div>
									<h3 className="mb-2 font-semibold">
										Day 1: Generate Artifacts
									</h3>
									<p className="text-muted-foreground text-sm">
										A Jupyter notebook is automatically generated with Python
										implementations of the algorithms, mock datasets, and test
										cases for each claim.
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-border bg-background p-6">
							<div className="flex items-start gap-4">
								<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
									3
								</div>
								<div>
									<h3 className="mb-2 font-semibold">Day 1: Apply Storybook</h3>
									<p className="text-muted-foreground text-sm">
										You select the Storybook module to generate a children's
										story version of the paper that explains the concepts simply
										and engagingly.
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-border bg-background p-6">
							<div className="flex items-start gap-4">
								<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
									4
								</div>
								<div>
									<h3 className="mb-2 font-semibold">
										Day 2-3: Test & Validate
									</h3>
									<p className="text-muted-foreground text-sm">
										You run the generated notebook, testing each claim with mock
										data. You can modify parameters and datasets to understand
										how claims hold under different conditions.
									</p>
								</div>
							</div>
						</div>

						<div className="rounded-lg border border-border bg-background p-6">
							<div className="flex items-start gap-4">
								<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
									5
								</div>
								<div>
									<h3 className="mb-2 font-semibold">Day 3: Share & Export</h3>
									<p className="text-muted-foreground text-sm">
										Export results as JSON for your pipeline, download the
										notebook for your team, or share the Storybook version with
										non-technical stakeholders.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="mb-4 font-bold text-3xl">Ready to Start?</h2>
					<p className="mb-8 text-lg text-muted-foreground">
						Upload your first research paper and experience the full power of
						Paper2Notebook.
					</p>
					<Button size="lg" asChild>
						<Link href="/dashboard" className="gap-2">
							Go to Dashboard <ArrowRight className="h-4 w-4" />
						</Link>
					</Button>
				</div>
			</section>
		</main>
	);
}
