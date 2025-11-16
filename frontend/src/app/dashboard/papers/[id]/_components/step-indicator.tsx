'use client';

import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import type { StepIndicatorProps } from './step-types';

export function StepIndicator({
	stepStatus,
	isProcessing,
	isLoading,
	canClick,
	onClick,
	config,
	isLast,
}: StepIndicatorProps) {
	return (
		<div className="flex flex-1 flex-col items-center gap-3">
			{/* Step Indicator with Icon */}
			<button
				onClick={onClick}
				disabled={!canClick || isLoading}
				className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
					stepStatus === 'completed'
						? 'border-green-500 bg-green-50'
						: stepStatus === 'current'
							? 'border-blue-500 bg-blue-50'
							: stepStatus === 'failed'
								? 'border-red-500 bg-red-50'
								: 'border-gray-200 bg-gray-50'
				} ${
					canClick
						? 'cursor-pointer hover:border-blue-400 hover:bg-blue-100'
						: ''
				}`}
				type="button"
			>
				{stepStatus === 'completed' && (
					<CheckCircle2 className="h-6 w-6 text-green-600" />
				)}
				{stepStatus === 'current' && (
					<div
						className={`${isProcessing ? 'animate-pulse' : ''} text-blue-600`}
					>
						{config.icon}
					</div>
				)}
				{stepStatus === 'failed' && (
					<AlertCircle className="h-6 w-6 text-red-600" />
				)}
				{stepStatus === 'upcoming' && (
					<div className={`${isLoading ? 'animate-spin' : ''} text-gray-400`}>
						{isLoading ? <Loader className="h-5 w-5" /> : config.icon}
					</div>
				)}
			</button>

			{/* Connector Line */}
			<div
				className={`-mx-2 h-1 flex-1 transition-colors ${isLast ? 'opacity-0' : ''} ${
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
}
