import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { cn } from '@/lib';

export const StatusBadge: React.FC<TStatusBadgeProps> = (props) => {
	const { status, className } = props;

	const label = React.useMemo(() => {
		switch (status) {
			case 'in-progress':
				return 'In Progress';
			case 'maintenance':
				return 'Maintenance';
			case 'discontinued':
				return 'Discontinued';
			case 'paused':
				return 'Paused';
			case 'pivoted':
				return 'Pivoted';
			case 'completed':
				return 'Completed';
			default:
				return null;
		}
	}, [status]);

	return <span className={cn(statusBadgeVariants({ status }), className)}>{label}</span>;
};

export interface TStatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
	className?: string;
}

export const statusBadgeVariants = cva(
	'rounded-full px-2 py-1 text-[11px] leading-none font-medium',
	{
		variants: {
			status: {
				'in-progress': 'bg-blue-500/15 text-blue-500',
				'maintenance': 'bg-purple-500/15 text-purple-500',
				'discontinued': 'bg-red-500/15 text-red-500',
				'paused': 'bg-amber-500/15 text-amber-500',
				'pivoted': 'bg-orange-500/15 text-orange-500',
				'completed': 'bg-green-500/15 text-green-500'
			}
		}
	}
);
