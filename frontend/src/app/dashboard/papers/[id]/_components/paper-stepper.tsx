'use client';

import {
	AlertCircle,
	Brain,
	CheckCircle2,
	FileCheck,
	FileText,
	Play,
	TestTube,
	Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { PaperStage } from '../../_data/schemas';
import { paperStages } from '../../_data/schemas';

interface PaperStepperProps {
	currentStage: PaperStage;
	status: string;
}

const stageConfig: Record<
	PaperStage,
	{ label: string; description: string; icon: ReactNode }
> = {
	ingest: {
		label: 'Ingest Paper',
		description: 'Uploading',
		icon: <FileText className="h-5 w-5" />,
	},
	extract: {
		label: 'Extract Claims',
		description: 'Parsing',
		icon: <Zap className="h-5 w-5" />,
	},
	plan: {
		label: 'Create Plan',
		description: 'Planning',
		icon: <Brain className="h-5 w-5" />,
	},
	generate_test: {
		label: 'Generate Tests',
		description: 'Creating',
		icon: <TestTube className="h-5 w-5" />,
	},
	run_test: {
		label: 'Run Tests',
		description: 'Testing',
		icon: <Play className="h-5 w-5" />,
	},
	report: {
		label: 'Generate Report',
		description: 'Finalizing',
		icon: <FileCheck className="h-5 w-5" />,
	},
};

export function PaperStepper({ currentStage, status }: PaperStepperProps) {
	const currentStageIndex = paperStages.indexOf(currentStage);
	const isProcessing = status.toLowerCase() === 'processing';
	const isFailed = status.toLowerCase() === 'failed';

	const getStepStatus = (
		stepIndex: number,
	): 'completed' | 'current' | 'upcoming' | 'failed' => {
		if (isFailed) {
			if (stepIndex === currentStageIndex) return 'failed';
			if (stepIndex < currentStageIndex) return 'completed';
			return 'upcoming';
		}

		if (stepIndex < currentStageIndex) return 'completed';
		if (stepIndex === currentStageIndex) return 'current';
		return 'upcoming';
	};

	return (
		<div>
			<div className="flex items-center justify-between gap-2">
				{paperStages.map((stage, index) => {
					const stepStatus = getStepStatus(index);
					const isLast = index === paperStages.length - 1;
					const config = stageConfig[stage];

					return (
						<div
							key={stage}
							className="flex flex-1 flex-col items-center gap-3"
						>
							{/* Step Indicator with Icon */}
							<div
								className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
									stepStatus === 'completed'
										? 'border-green-500 bg-green-50'
										: stepStatus === 'current'
											? 'border-blue-500 bg-blue-50'
											: stepStatus === 'failed'
												? 'border-red-500 bg-red-50'
												: 'border-gray-200 bg-gray-50'
								}`}
							>
								{stepStatus === 'completed' && (
									<CheckCircle2 className="h-6 w-6 text-green-600" />
								)}
								{stepStatus === 'current' && (
									<div
										className={`${
											isProcessing ? 'animate-pulse' : ''
										} text-blue-600`}
									>
										{config.icon}
									</div>
								)}
								{stepStatus === 'failed' && (
									<AlertCircle className="h-6 w-6 text-red-600" />
								)}
								{stepStatus === 'upcoming' && (
									<div className="text-gray-400">{config.icon}</div>
								)}
							</div>

							{/* Connector Line */}
							<div
								className={`-mx-2 h-1 flex-1 transition-colors ${
									isLast ? 'opacity-0' : ''
								} ${
									stepStatus === 'completed'
										? 'bg-green-500'
										: stepStatus === 'current'
											? 'bg-blue-500'
											: 'bg-gray-200'
								}`}
							/>

							{/* Step Content */}
							<div className="flex h-14 w-full flex-col items-center justify-center text-center">
								<p
									className={`font-semibold text-sm ${
										stepStatus === 'completed'
											? 'text-green-700'
											: stepStatus === 'current'
												? 'text-blue-700'
												: stepStatus === 'failed'
													? 'text-red-700'
													: 'text-gray-500'
									}`}
								>
									{config.label}
								</p>
								<p
									className={`text-xs ${
										stepStatus === 'completed'
											? 'text-green-600'
											: stepStatus === 'current'
												? 'text-blue-600'
												: stepStatus === 'failed'
													? 'text-red-600'
													: 'text-gray-400'
									}`}
								>
									{config.description}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Status Footer */}
			<div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-4">
				<p className="font-medium text-gray-700 text-sm">
					Progress: {currentStageIndex + 1} of {paperStages.length} stages
				</p>
				<div className="h-2 w-48 overflow-hidden rounded-full bg-gray-200">
					<div
						className={`h-full transition-all ${
							isFailed
								? 'bg-red-500'
								: isProcessing
									? 'bg-blue-500'
									: 'bg-green-500'
						}`}
						style={{
							width: `${((currentStageIndex + 1) / paperStages.length) * 100}%`,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
