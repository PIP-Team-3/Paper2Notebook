import { fetchAPI, postAPI } from '../../../../../lib/api';
import { mockPaper } from '../../_data/fetchers';
import { type PaperSchema, paperSchema } from '../../_data/schemas';

export async function getPaper(id: string): Promise<PaperSchema> {
	const papersRes = await fetchAPI(`/papers/${id}`);
	return mockPaper(paperSchema.parse(papersRes));
}

export async function generateTests(planId: string): Promise<unknown> {
	const response = await fetchAPI(`/plans/${planId}/materialize`);
	return response;
}

export async function getLatestPlan(paperId: string): Promise<unknown> {
	const response = await fetchAPI(`/papers/${paperId}/latest-plan`);

	return response;
}

export async function extractClaimsStream(
	paperId: string,
	onLog: (log: {
		id: string;
		timestamp: string;
		type: 'progress' | 'log' | 'error' | 'complete';
		message: string;
		stage?: string;
		agent?: string;
		count?: number;
	}) => void,
): Promise<void> {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
	const url = `${baseUrl}/papers/${paperId}/extract`;

	return new Promise((resolve, reject) => {
		const eventSource = new EventSource(url);

		let logId = 0;

		eventSource.addEventListener('open', () => {
			onLog({
				id: String(logId++),
				timestamp: new Date().toLocaleTimeString(),
				type: 'progress',
				message: 'Connected to extraction service',
			});
		});

		// The API middleware sends all events as generic 'message' events
		// with a transformed JSON payload: { type: 'progress'|'log'|'complete'|'error', message: string, ... }
		eventSource.addEventListener('message', (event: MessageEvent) => {
			try {
				const data = JSON.parse(event.data);
				const timestamp = new Date().toLocaleTimeString();

				// The middleware already transformed the event into a readable format
				// Just pass it through with our metadata
				onLog({
					id: String(logId++),
					timestamp,
					type: data.type || 'log',
					message: data.message || '',
					count: data.count,
					agent: data.agent,
				});
			} catch (e) {
				// If not JSON, treat as plain text log
				onLog({
					id: String(logId++),
					timestamp: new Date().toLocaleTimeString(),
					type: 'log',
					message: event.data,
				});
			}
		});

		eventSource.addEventListener('error', () => {
			onLog({
				id: String(logId++),
				timestamp: new Date().toLocaleTimeString(),
				type: 'complete',
				message: 'Stream closed',
			});
			eventSource.close();
			resolve();
		});
	});
}

export async function generatePlan(paperId: string): Promise<unknown> {
	const response = await fetchAPI(`/papers/${paperId}/plan`);
	return response;
}

export async function runTests(planId: string): Promise<unknown> {
	const response = await fetchAPI(`/plans/${planId}/run`);
	return response;
}

export async function streamRunEvents(
	runId: string,
	onLog: (log: {
		id: string;
		timestamp: string;
		type: 'progress' | 'log' | 'error' | 'complete';
		message: string;
		percent?: number;
	}) => void,
): Promise<void> {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
	const url = `${baseUrl}/runs/${runId}/events`;

	return new Promise((resolve, reject) => {
		fetch(url, { method: 'GET' })
			.then((response) => {
				if (!response.ok) {
					throw new Error(
						`Failed to stream run events: ${response.statusText}`,
					);
				}

				const reader = response.body?.getReader();
				if (!reader) throw new Error('No readable stream');

				const decoder = new TextDecoder();
				let buffer = '';
				let logId = 0;

				const processChunk = async () => {
					const { done, value } = await reader.read();

					if (done) {
						onLog({
							id: String(logId++),
							timestamp: new Date().toLocaleTimeString(),
							type: 'complete',
							message: 'Run completed',
						});
						resolve();
						return;
					}

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split('\n');
					buffer = lines.pop() || '';

					for (const line of lines) {
						if (!line.startsWith('data: ')) continue;

						try {
							const logData = JSON.parse(line.slice(6));
							const logEntry = {
								id: String(logId++),
								timestamp: new Date().toLocaleTimeString(),
								type: (logData.type || 'log') as
									| 'progress'
									| 'log'
									| 'error'
									| 'complete',
								message: logData.message || '',
								percent: logData.percent,
							};
							onLog(logEntry);
						} catch (err) {
							console.error('Failed to parse log entry:', err);
						}
					}

					await processChunk();
				};

				processChunk().catch(reject);
			})
			.catch(reject);
	});
}
