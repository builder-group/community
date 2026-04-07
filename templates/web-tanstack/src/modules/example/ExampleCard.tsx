import React from 'react';
import { cn } from '@/lib';

export const ExampleCard: React.FC<TExampleCardProps> = (props) => {
	const { title, description, className } = props;

	return (
		<article
			className={cn(
				'rounded-2xl border border-black/10 bg-white/75 p-5 shadow-sm backdrop-blur',
				className
			)}
		>
			<h2 className="text-base font-semibold text-black">{title}</h2>
			<p className="mt-2 text-sm leading-6 text-black/60">{description}</p>
		</article>
	);
};

interface TExampleCardProps {
	title: string;
	description: string;
	className?: string;
}
