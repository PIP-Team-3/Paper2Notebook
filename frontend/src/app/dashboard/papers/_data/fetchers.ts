import { z } from 'zod';
import { fetchAPI, uploadFileAPI } from '../../../../lib/api';
import { type PaperSchema, paperSchema } from './schemas';

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
	datasetFile?: File,
): Promise<PaperSchema> {
	const formData = new FormData();

	if (file) {
		formData.append('file', file);
	}

	if (url) {
		formData.append('source_url', url);
	}

	if (datasetFile) {
		formData.append('dataset_file', datasetFile);
	}

	const res = await uploadFileAPI('/papers/', formData);

	const paperRes = await getPaper(res.paper_id);
	return paperRes;
}
