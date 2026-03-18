import React from 'react';

export const CanvasFrame: React.FC<TCanvasFrameProps> = (props) => {
	const { label, children } = props;

	return (
		<div className="relative pt-7">
			<span className="text-accent absolute top-0 left-0 z-10 px-1 font-mono text-[11px] leading-none select-none">
				{label}
			</span>
			<div className="relative">
				<div className="border-accent bg-base-0 absolute -top-[5px] -left-[5px] z-10 h-[10px] w-[10px] border" />
				<div className="border-accent bg-base-0 absolute -top-[5px] -right-[5px] z-10 h-[10px] w-[10px] border" />
				<div className="border-accent bg-base-0 absolute -bottom-[5px] -left-[5px] z-10 h-[10px] w-[10px] border" />
				<div className="border-accent bg-base-0 absolute -right-[5px] -bottom-[5px] z-10 h-[10px] w-[10px] border" />
				<div className="border-accent/40 overflow-hidden border">{children}</div>
			</div>
		</div>
	);
};

interface TCanvasFrameProps {
	label: string;
	children: React.ReactNode;
}
