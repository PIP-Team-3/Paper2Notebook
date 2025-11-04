import { Brain, CheckCircle, Clock, FileText, Upload } from 'lucide-react';

export default function DashboardOverview() {
	return (
		<div className="min-h-screen space-y-10 bg-white p-8">
			{/* Title */}
			<h1 className="font-semibold text-3xl text-foreground">
				Dashboard Overview
			</h1>

			{/* --- Overview Cards --- */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{/* Papers Processed */}
				<div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-white p-6 shadow-sm transition hover:shadow-md">
					<div>
						<h2 className="font-medium text-foreground/70 text-sm uppercase tracking-wide">
							Papers Processed
						</h2>
						<p className="mt-1 font-bold text-4xl text-primary">8</p>
					</div>
					<FileText className="h-10 w-10 text-primary/70" />
				</div>

				{/* Last Upload */}
				<div className="flex items-center justify-between rounded-2xl border border-primary/30 bg-white p-6 shadow-sm transition hover:shadow-md">
					<div>
						<h2 className="font-medium text-foreground/70 text-sm uppercase tracking-wide">
							Last Upload
						</h2>
						<p className="mt-1 font-semibold text-2xl text-primary">
							Nov 3, 2025
						</p>
					</div>
					<Clock className="h-10 w-10 text-primary/70" />
				</div>
			</div>

			{/* --- Recent Activity --- */}
			<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
				<h2 className="mb-4 font-semibold text-foreground text-xl">
					Recent Activity
				</h2>

				<table className="w-full text-foreground/70 text-sm">
					<thead>
						<tr className="border-gray-200 border-b text-left">
							<th className="pb-2">Date</th>
							<th className="pb-2">Action</th>
							<th className="pb-2 text-center">Status</th>
						</tr>
					</thead>
					<tbody>
						<tr className="border-gray-100 border-b transition hover:bg-primary/5">
							<td className="py-2">Nov 3</td>
							<td>
								Uploaded{' '}
								<span className="font-medium text-primary">
									huang_2017_densenet.pdf
								</span>
							</td>
							<td className="flex items-center justify-center gap-1 py-2 text-green-600">
								<CheckCircle size={16} /> Completed
							</td>
						</tr>
						<tr className="border-gray-100 border-b transition hover:bg-primary/5">
							<td className="py-2">Nov 2</td>
							<td>Applied Storybook module</td>
							<td className="flex items-center justify-center gap-1 py-2 text-primary">
								<Brain size={16} /> Processed
							</td>
						</tr>
						<tr className="border-gray-100 border-b transition hover:bg-primary/5">
							<td className="py-2">Nov 1</td>
							<td>Added Comparison analysis</td>
							<td className="flex items-center justify-center gap-1 py-2 text-yellow-600">
								<Clock size={16} /> Running
							</td>
						</tr>
						<tr className="transition hover:bg-primary/5">
							<td className="py-2">Oct 30</td>
							<td>
								Uploaded{' '}
								<span className="font-medium text-primary">
									miller_2018_hot_hand.pdf
								</span>
							</td>
							<td className="flex items-center justify-center gap-1 py-2 text-green-600">
								<CheckCircle size={16} /> Completed
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* --- How to Use --- */}
			<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
				<h2 className="mb-4 font-semibold text-foreground text-xl">
					How to Use Paper2Notebook
				</h2>

				<div className="grid gap-4 md:grid-cols-2">
					{[
						{
							icon: <Upload className="h-6 w-6 text-primary" />,
							title: 'Upload',
							text: 'Add your research paper (PDF, text, or markdown).',
						},
						{
							icon: <Brain className="h-6 w-6 text-primary" />,
							title: 'AI Extraction',
							text: 'Automatically identify claims, methods, and results.',
						},
						{
							icon: <FileText className="h-6 w-6 text-primary" />,
							title: 'Generate Notebook',
							text: 'Create structured Jupyter-ready notebooks.',
						},
						{
							icon: <CheckCircle className="h-6 w-6 text-primary" />,
							title: 'Apply Modules',
							text: 'Add analysis modules like Storybook or Summary.',
						},
					].map((item, idx) => (
						<div
							key={item.title}
							className="rounded-xl border border-primary/10 bg-primary/5 p-4 transition hover:border-primary/30"
						>
							<div className="mb-2 flex items-center gap-3">
								{item.icon}
								<h3 className="font-semibold text-foreground">{item.title}</h3>
							</div>
							<p className="text-foreground/60 text-sm">{item.text}</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
