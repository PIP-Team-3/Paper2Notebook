import type { ReactNode } from 'react';

interface FeatureCardProps {
	icon: ReactNode;
	title: string;
	description: string;
	highlight?: boolean;
}

export function FeatureCard({
	icon,
	title,
	description,
	highlight = false,
}: FeatureCardProps) {
	return (
		<div
			className={`rounded-lg border p-6 transition-all ${
				highlight
					? 'scale-105 border-primary bg-primary text-primary-foreground shadow-lg'
					: 'border-border bg-card hover:border-primary/50 hover:shadow-md'
			}`}
		>
			<div
				className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${highlight ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}
			>
				{icon}
			</div>
			<h3 className="mb-2 font-semibold text-lg">{title}</h3>
			<p
				className={`text-sm ${highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
			>
				{description}
			</p>
		</div>
	);
}
