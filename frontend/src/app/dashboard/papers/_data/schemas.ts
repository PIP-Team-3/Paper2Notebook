import { z } from 'zod';

const incomingPaperSchema = z.object({
	id: z.string(),
	title: z.string(),
	created_at: z.iso.datetime({ offset: true }),
	status: z.string(),
	source_url: z.url().nullable().or(z.string('')),
});

export const paperStages = [
	'ingest',
	'extract',
	'plan',
	'generate_test',
	'run_test',
	'report',
] as const;

export type PaperStage = (typeof paperStages)[number];

export interface PaperStats {
	tokens: number;
	cost: number;
	runningTime: number;
}

export const paperSchema = incomingPaperSchema.transform((data) => ({
	id: data.id,
	title: data.title,
	createdAt: data.created_at,
	status: data.status,
	sourceUrl: data.source_url,
}));

export type PaperSchema = z.infer<typeof paperSchema> & {
	stage: PaperStage;
	stats: PaperStats;
};
