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