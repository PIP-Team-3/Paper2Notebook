interface StatCardProps {
	label: string;
	value: string;
}

export function StatCard({ label, value }: StatCardProps) {
	return (
		<div className="flex cursor-default flex-col items-center rounded-lg bg-primary/10 p-4 transition-colors duration-200 hover:bg-primary/15">
			<p className="font-medium text-gray-600 text-xs">{label}</p>
			<p className="mt-2 font-bold text-3xl text-primary">{value}</p>
		</div>
	);
}
