import React from 'react';
import { cn } from '@/lib';

export const CanvasBackground: React.FC<TCanvasBackgroundProps> = (props) => {
	const { className, children } = props;

	return (
		<div
			className={cn(
				'bg-base-200 bg-[radial-gradient(circle,rgba(0,0,0,0.07)_1px,transparent_1px)] bg-size-[24px_24px] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.07)_1px,transparent_1px)]',
				className
			)}
		>
			{children}
		</div>
	);
};

interface TCanvasBackgroundProps {
	className?: string;
	children: React.ReactNode;
}
