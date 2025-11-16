'use client';

import { useRouter } from 'next/navigation';
import { PaperStepper } from './paper-stepper';
import type { PaperStage } from '../../_data/schemas';

interface PaperStepperWrapperProps {
	currentStage: PaperStage;
	status: string;
	paperId: string;
}

export function PaperStepperWrapper({
	currentStage,
	status,
	paperId,
}: PaperStepperWrapperProps) {
	const router = useRouter();

	const handleRefresh = () => {
		// Refresh the page data from the server
		router.refresh();
	};

	return (
		<PaperStepper
			currentStage={currentStage}
			status={status}
			paperId={paperId}
			onStepComplete={handleRefresh}
		/>
	);
}
