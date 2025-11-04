import { z } from 'zod';
import { fetchAPI, uploadFileAPI } from '@/lib/api';
import { type PaperSchema, paperSchema, paperStages } from './schemas';

export async function getAllPapers(): Promise<PaperSchema[]> {
	const papersRes = await fetchAPI('/papers');
	return z.array(paperSchema).parse(papersRes).map(mockPaper);
}

export async function getPaper(id: string): Promise<PaperSchema> {
	const paperRes = await fetchAPI(`/papers/${id}`);
	return mockPaper(paperSchema.parse(paperRes));
}
export function mockPaper(paper: z.infer<typeof paperSchema>): PaperSchema {
	return Object.assign(
		{
			stage: paperStages[Math.floor(Math.random() * paperStages.length)],
			stats: {
				tokens: Math.floor(Math.random() * 10000 + 10),
				cost: Math.random() * 50,
				runningTime: Math.floor(Math.random() * 1000) + 10,
			},
		},
		paper,
	);
}

export async function uploadPaper(
	file?: File,
	url?: string,
): Promise<PaperSchema> {
	const formData = new FormData();

	if (file) {
		formData.append('file', file);
	}

	if (url) {
		formData.append('source_url', url);
	}

	const paperRes = await uploadFileAPI('/papers/', formData);
	return mockPaper(paperSchema.parse(paperRes));
}
