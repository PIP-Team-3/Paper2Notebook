export interface Claim {
	id: string;
	dataset_name: string;
	split: string;
	metric_name: string;
	metric_value: number;
	units: string;
	source_citation: string;
	confidence: number;
	created_at: string;
}
