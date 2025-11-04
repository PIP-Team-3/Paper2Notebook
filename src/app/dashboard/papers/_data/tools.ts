import { AlertCircle, CircleCheck, Clock, type LucideIcon } from 'lucide-react';

export interface StatusIcon {
	icon: LucideIcon;
	colorClass: string;
}

export function getStatusIcon(status: string): StatusIcon {
	const statusLower = status.toLowerCase();
	switch (statusLower) {
		case 'ready':
			return {
				icon: CircleCheck,
				colorClass: 'text-green-500',
			};
		case 'processing':
			return {
				icon: Clock,
				colorClass: 'text-yellow-500',
			};
		case 'failed':
			return {
				icon: AlertCircle,
				colorClass: 'text-red-500',
			};
		default:
			return {
				icon: AlertCircle,
				colorClass: 'text-gray-500',
			};
	}
}
