'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PlanDisplayProps {
	plan: any;
	show: boolean;
	onClose: () => void;
}

export function PlanDisplay({ plan, show, onClose }: PlanDisplayProps) {
	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({
		overview: true,
		explanation: true,
		dataset: true,
		model: true,
		config: true,
		metrics: true,
		visualizations: true,
		justifications: false,
	});

	if (!show || !plan) return null;

	const toggleSection = (section: string) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const SectionHeader = ({
		title,
		section,
	}: {
		title: string;
		section: string;
	}) => (
		<button
			onClick={() => toggleSection(section)}
			className="flex w-full items-center justify-between rounded-lg bg-blue-100 px-4 py-3 text-left font-semibold text-blue-900 transition-colors hover:bg-blue-200"
			type="button"
		>
			<span>{title}</span>
			{expandedSections[section] ? (
				<ChevronUp className="h-5 w-5" />
			) : (
				<ChevronDown className="h-5 w-5" />
			)}
		</button>
	);

	const SectionContent = ({ children }: { children: React.ReactNode }) => (
		<div className="space-y-2 border-l-4 border-blue-200 bg-blue-50 px-4 py-3">
			{children}
		</div>
	);

	const DataItem = ({ label, value }: { label: string; value: any }) => (
		<div className="flex justify-between gap-4">
			<span className="font-medium text-gray-700">{label}:</span>
			<span className="text-gray-600">
				{typeof value === 'object' ? JSON.stringify(value) : String(value)}
			</span>
		</div>
	);

	return (
		<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
			<div className="border-b border-gray-200 bg-gray-100 px-4 py-3">
				<h3 className="font-semibold text-gray-800">Reproduction Plan</h3>
				<p className="text-gray-600 text-sm">
					LLM-generated plan for reproducing the claims
				</p>
			</div>

			<div className="space-y-3 p-4">
				{/* Overview Section */}
				<div className="space-y-2">
					<SectionHeader title="Overview" section="overview" />
					{expandedSections.overview && (
						<SectionContent>
							<DataItem label="Version" value={plan.version} />
							<DataItem
								label="Budget"
								value={`${plan.policy?.budget_minutes || 'N/A'} minutes`}
							/>
							<DataItem
								label="Estimated Runtime"
								value={`${plan.estimated_runtime_minutes || 'N/A'} minutes`}
							/>
							<DataItem
								label="Framework"
								value={plan.config?.framework || 'N/A'}
							/>
							<DataItem
								label="License Compliant"
								value={plan.license_compliant ? 'Yes' : 'No'}
							/>
						</SectionContent>
					)}
				</div>

				{/* Explanation Section */}
				{plan.explain && plan.explain.length > 0 && (
					<div className="space-y-2">
						<SectionHeader title="Explanation" section="explanation" />
						{expandedSections.explanation && (
							<SectionContent>
								{plan.explain.map((explanation, idx) => (
									<p key={idx} className="text-gray-700 text-sm">
										{explanation}
									</p>
								))}
							</SectionContent>
						)}
					</div>
				)}

				{/* Dataset Section */}
				{plan.dataset && (
					<div className="space-y-2">
						<SectionHeader title="Dataset" section="dataset" />
						{expandedSections.dataset && (
							<SectionContent>
								<DataItem label="Name" value={plan.dataset.name} />
								<DataItem label="Split" value={plan.dataset.split} />
								{plan.dataset.notes && (
									<>
										<p className="mt-2 font-medium text-gray-700">Notes:</p>
										<p className="text-gray-600 text-sm">
											{plan.dataset.notes}
										</p>
									</>
								)}
							</SectionContent>
						)}
					</div>
				)}

				{/* Model Section */}
				{plan.model && (
					<div className="space-y-2">
						<SectionHeader title="Model" section="model" />
						{expandedSections.model && (
							<SectionContent>
								<DataItem label="Name" value={plan.model.name} />
								<DataItem label="Variant" value={plan.model.variant} />
								<DataItem
									label="Size Category"
									value={plan.model.size_category}
								/>
								{plan.model.parameters && (
									<>
										<p className="mt-2 font-medium text-gray-700">
											Parameters:
										</p>
										<div className="space-y-1">
											{Object.entries(plan.model.parameters).map(
												([key, value]) => (
													<div key={key} className="text-gray-600 text-sm">
														<span className="font-medium">{key}:</span>{' '}
														{typeof value === 'object'
															? JSON.stringify(value)
															: String(value)}
													</div>
												),
											)}
										</div>
									</>
								)}
							</SectionContent>
						)}
					</div>
				)}

				{/* Config Section */}
				{plan.config && (
					<div className="space-y-2">
						<SectionHeader title="Training Config" section="config" />
						{expandedSections.config && (
							<SectionContent>
								<DataItem label="Batch Size" value={plan.config.batch_size} />
								<DataItem
									label="Learning Rate"
									value={plan.config.learning_rate}
								/>
								<DataItem label="Epochs" value={plan.config.epochs} />
								<DataItem label="Optimizer" value={plan.config.optimizer} />
								<DataItem label="Seed" value={plan.config.seed} />
							</SectionContent>
						)}
					</div>
				)}

				{/* Metrics Section */}
				{plan.metrics && plan.metrics.length > 0 && (
					<div className="space-y-2">
						<SectionHeader title="Metrics" section="metrics" />
						{expandedSections.metrics && (
							<SectionContent>
								{plan.metrics.map((metric, idx) => (
									<div
										key={idx}
										className="rounded border border-gray-300 bg-white p-3 text-sm"
									>
										<div className="font-semibold text-gray-800">
											{metric.name}
										</div>
										<div className="mt-2 space-y-1 text-gray-600">
											<div>
												<span className="font-medium">Goal:</span> {metric.goal}
											</div>
											<div>
												<span className="font-medium">Split:</span>{' '}
												{metric.split}
											</div>
											<div>
												<span className="font-medium">Direction:</span>{' '}
												{metric.direction}
											</div>
											<div>
												<span className="font-medium">Tolerance:</span> ±
												{metric.tolerance}
											</div>
										</div>
									</div>
								))}
							</SectionContent>
						)}
					</div>
				)}

				{/* Visualizations Section */}
				{plan.visualizations && plan.visualizations.length > 0 && (
					<div className="space-y-2">
						<SectionHeader title="Visualizations" section="visualizations" />
						{expandedSections.visualizations && (
							<SectionContent>
								<ul className="space-y-1 list-inside list-disc">
									{plan.visualizations.map((viz, idx) => (
										<li key={idx} className="text-gray-600">
											{viz}
										</li>
									))}
								</ul>
							</SectionContent>
						)}
					</div>
				)}

				{/* Justifications Section */}
				{plan.justifications && Object.keys(plan.justifications).length > 0 && (
					<div className="space-y-2">
						<SectionHeader title="Justifications" section="justifications" />
						{expandedSections.justifications && (
							<SectionContent>
								<div className="space-y-4">
									{Object.entries(plan.justifications).map(
										([key, justification]: [string, any]) => (
											<div
												key={key}
												className="rounded border border-gray-300 bg-white p-3"
											>
												<h4 className="mb-2 font-semibold text-gray-800 capitalize">
													{key}
												</h4>
												{justification.quote && (
													<div className="mb-2">
														<p className="text-xs font-medium text-gray-600">
															Quote:
														</p>
														<p className="italic text-gray-700 text-sm">
															"{justification.quote}"
														</p>
													</div>
												)}
												{justification.citation && (
													<div>
														<p className="text-xs font-medium text-gray-600">
															Citation:
														</p>
														<p className="text-gray-700 text-sm">
															{justification.citation}
														</p>
													</div>
												)}
											</div>
										),
									)}
								</div>
							</SectionContent>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
