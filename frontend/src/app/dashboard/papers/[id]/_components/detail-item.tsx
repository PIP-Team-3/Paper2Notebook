import type { ReactNode } from 'react';

interface DetailItemProps {
	title: string;
	children: ReactNode;
}

export function DetailItem({ title, children }: DetailItemProps) {
	return (
		<div>
			<h3 className="mb-1 font-semibold text-gray-500 text-xs uppercase tracking-wider">
				{title}
			</h3>
			<p className="font-medium text-gray-900 text-sm">{children}</p>
		</div>
	);
}
