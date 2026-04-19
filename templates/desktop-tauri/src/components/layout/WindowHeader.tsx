import React from 'react';
import { usePlatform } from '@/hooks';
import { cn } from '@/lib';

export const WindowHeader: React.FC<TWindowHeaderProps> = (props) => {
	const { title, floating = false, className } = props;

	return (
		<header
			className={cn(
				'flex h-11 shrink-0 items-center px-4 select-none',
				floating && 'absolute inset-x-0 top-0 z-10',
				className
			)}
		>
			<WindowControlsInset />
			{title ? <span className="ml-2 text-sm font-semibold text-black/70">{title}</span> : null}
			<div data-tauri-drag-region className="h-full flex-1" />
		</header>
	);
};

interface TWindowHeaderProps {
	title?: string;
	floating?: boolean;
	className?: string;
}

export const WindowControlsInset: React.FC = () => {
	const platform = usePlatform();

	return (
		<div
			data-tauri-drag-region
			className={cn(platform === 'macos' ? 'h-full w-[60px] shrink-0' : 'h-full w-0')}
		/>
	);
};
