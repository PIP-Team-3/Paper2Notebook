'use client';

import { useState } from 'react';
import { extractClaimsStream } from '../_data/fetchers';
import type { BaseStepProps, LogEntry } from './step-types';
import { LogsDisplay } from './logs-display';
import { ClaimsTable } from './claims-table';

export function useExtractClaimsStep(paperId: string) {
	const [isExtracting, setIsExtracting] = useState(false);
	const [extractError, setExtractError] = useState<string | null>(null);
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [showLogs, setShowLogs] = useState(false);

	const handleExtractClick = async () => {
		try {
			setIsExtracting(true);
			setExtractError(null);
			setLogs([]);
			setShowLogs(true);

			await extractClaimsStream(paperId, (log: LogEntry) => {
				setLogs((prev) => [...prev, log]);
				console.log(`[${log.type}] ${log.message}`);
			});
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to extract claims';
			setExtractError(errorMessage);
		} finally {
			setIsExtracting(false);
		}
	};

	return {
		isExtracting,
		extractError,
		logs,
		showLogs,
		setShowLogs,
		handleExtractClick,
	};
}
