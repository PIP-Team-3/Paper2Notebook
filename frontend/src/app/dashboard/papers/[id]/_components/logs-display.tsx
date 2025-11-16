'use client';

import { X } from 'lucide-react';
import type { LogEntry } from './step-types';

interface LogsDisplayProps {
	title: string;
	logs: LogEntry[];
	onClose: () => void;
}

export function LogsDisplay({ title, logs, onClose }: LogsDisplayProps) {
	if (logs.length === 0) return null;

	return (
		<div className="mt-4 rounded-lg border border-gray-200 bg-gray-50">
			<div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
				<p className="font-semibold text-gray-700 text-sm">{title}</p>
				<button
					onClick={onClose}
					className="text-gray-500 hover:text-gray-700"
					type="button"
				>
					<X className="h-4 w-4" />
				</button>
			</div>
			<div className="max-h-64 overflow-y-auto">
				<div className="space-y-1 p-3 font-mono text-xs">
					{logs.map((log) => (
						<div
							key={log.id}
							className={`${
								log.type === 'error'
									? 'text-red-600'
									: log.type === 'complete'
										? 'text-green-600'
										: log.type === 'progress'
											? 'text-blue-600'
											: 'text-gray-600'
							}`}
						>
							<span className="text-gray-400">[{log.timestamp}]</span>{' '}
							{log.agent && (
								<span className="text-gray-500">[{log.agent}]</span>
							)}{' '}
							{log.message}
							{log.percent !== undefined && (
								<span className="ml-2 text-gray-500">({log.percent}%)</span>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
