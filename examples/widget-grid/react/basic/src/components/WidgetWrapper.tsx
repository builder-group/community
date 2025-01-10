import { useFeatureState } from 'feature-react/state';
import React, { useRef } from 'react';
import { getRegionPixels, TRegionPixels, TWidget, TWidgetGrid } from 'widget-grid';

export const WidgetWrapper = <GContent extends any>(props: TWidgetWrapperProps<GContent>) => {
	const { renderItem, index, widget, widgetGrid } = props;
	const cellSize = useFeatureState(widgetGrid.cellSize);

	const elementRef = useRef<HTMLDivElement>(null);
	const [region, setRegion] = React.useState(widget.region);

	const [isAnimating, setIsAnimating] = React.useState(false);
	const [regionPixels, setRegionPixels] = React.useState<TRegionPixels | undefined>(
		region != null ? getRegionPixels(region, cellSize) : undefined
	);

	const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		event.preventDefault();

		const origin = widgetGrid.pointerEventToViewportPoint(event);
		console.log({ origin });

		startAnimation();

		// TODO
	}, []);

	const handlePointerUp = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		event.preventDefault();

		// TODO
	}, []);

	const startAnimation = () => {
		const element = elementRef.current;
		if (!element || !region) return;

		// Get the current position
		const currentRect = element.getBoundingClientRect();
		const { x: left, y: top } = widgetGrid.pointerEventToViewportPoint({
			clientX: currentRect.left,
			clientY: currentRect.top
		});
		const initialPosition = {
			left,
			top,
			width: currentRect.width,
			height: currentRect.height
		};

		// Calculate target position
		const targetRegion = {
			start: { row: 0, col: 0 },
			dimension: { height: 1, width: 1 }
		};
		const targetPixels = getRegionPixels(targetRegion, cellSize);
		console.log({ targetPixels });

		setIsAnimating(true);
		setRegionPixels(targetPixels);

		// Apply the animation
		Object.assign(element.style, {
			transform: `translate(${targetPixels.x - initialPosition.left}px, ${targetPixels.y - initialPosition.top}px)`
		});

		// Switch back to grid positioning after animation
		const onTransitionEnd = () => {
			element.style.transform = '';
			setIsAnimating(false);
			setRegion(targetRegion);
			element.removeEventListener('transitionend', onTransitionEnd);
		};

		element.addEventListener('transitionend', onTransitionEnd);
	};

	if (region == null) {
		return null;
	}

	return (
		<div
			ref={elementRef}
			key={`${widget.id}-${index}`}
			style={
				isAnimating
					? {
							position: 'absolute',
							gridArea: `${region.start.row + 1} / ${region.start.col + 1} / span ${region.dimension.height} / span ${region.dimension.width}`,
							width: regionPixels?.width,
							height: regionPixels?.height,
							transition:
								'transform 0.5s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out'
						}
					: {
							position: 'relative',
							width: regionPixels?.width,
							height: regionPixels?.height,
							gridArea: `${region.start.row + 1} / ${region.start.col + 1} / span ${region.dimension.height} / span ${region.dimension.width}`
						}
			}
			onPointerDown={(event) => {
				handlePointerDown(event);
			}}
			onPointerUp={(event) => {
				handlePointerUp(event);
			}}
		>
			{renderItem(widget)}
		</div>
	);
};

export interface TWidgetWrapperProps<GContent> {
	widgetGrid: TWidgetGrid<GContent, []>;
	renderItem: (widget: TWidget<GContent>) => React.ReactNode;
	index: number;
	widget: TWidget<GContent>;
}
