import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/lib';

export const CanvasButton: React.FC<TCanvasButtonProps> = (props) => {
	const { variant, className, children, ...rest } = props;

	return (
		<a className={cn(canvasButtonVariants({ variant }), className)} {...rest}>
			{children}
		</a>
	);
};

export interface TCanvasButtonProps
	extends
		React.AnchorHTMLAttributes<HTMLAnchorElement>,
		VariantProps<typeof canvasButtonVariants> {}

export const canvasButtonVariants = cva(
	'focus-visible:ring-base-500 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
	{
		variants: {
			variant: {
				outline: 'text-base-700 ring-base-300 hover:bg-base-200 hover:ring-base-400 ring-1',
				primary: 'bg-base-950 text-base-0 hover:bg-base-800'
			}
		},
		defaultVariants: { variant: 'outline' }
	}
);
