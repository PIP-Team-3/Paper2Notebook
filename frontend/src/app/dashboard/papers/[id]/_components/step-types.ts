import type { ReactNode } from 'react';
import type { PaperStage } from '../../_data/schemas';

export interface LogEntry {
	id: string;
	timestamp: string;
	type: 'progress' | 'log' | 'error' | 'complete' | 'metric';
	message: string;
	stage?: string;
	agent?: string;
	count?: number;
	percent?: number;
	metric?: string;
	value?: number;
	split?: string;
}

export type StepStatus = 'completed' | 'current' | 'upcoming' | 'failed';

export interface StageConfig {
	label: string;
	description: string;
	icon: ReactNode;
}

export interface StepIndicatorProps {
	stage: PaperStage;
	stepStatus: StepStatus;
	isProcessing: boolean;
	isLoading: boolean;
	canClick: boolean;
	onClick?: () => void;
	config: StageConfig;
	isLast: boolean;
}

export interface BaseStepProps {
	paperId: string;
	stepStatus: StepStatus;
	isProcessing: boolean;
	onStatusChange?: () => void;
}
