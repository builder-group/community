import { useFeatureState } from 'feature-react/state';
import React, { useRef } from 'react';
import { getRegionPixels, TWidget, TWidgetBaseContent, TWidgetGrid } from 'widget-grid';

export const WidgetWrapper = <GContent extends TWidgetBaseContent>(
	props: TWidgetWrapperProps<GContent>
) => {
	const { renderItem, index, widget, widgetGrid } = props;
	const cellSize = useFeatureState(widgetGrid.cellSize);

	const nextRegion = useFeatureState(widget.region);
	const [currentRegion, setCurrentRegion] = React.useState(nextRegion);
	const currentRegionPixels = React.useMemo(
		() => (currentRegion != null ? getRegionPixels(currentRegion, cellSize) : null),
		[currentRegion, cellSize]
	);

	const elementRef = useRef<HTMLDivElement>(null);

	const handlePointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		event.preventDefault();

		const origin = widgetGrid.pointerEventToViewportPoint(event);
		console.log({ origin });

		// TODO:
	}, []);

	const handlePointerUp = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
		event.preventDefault();

		// TODO:
	}, []);

	React.useEffect(() => {
		if (nextRegion == null || elementRef.current == null) {
			return;
		}

		const element = elementRef.current;

		if (
			currentRegion?.start.row !== nextRegion.start.row ||
			currentRegion?.start.col !== nextRegion.start.col ||
			currentRegion?.dimension.width !== nextRegion.dimension.width ||
			currentRegion?.dimension.height !== nextRegion.dimension.height
		) {
			// Get the current position and size
			const currentRect = element.getBoundingClientRect();
			const { x: left, y: top } = widgetGrid.pointerEventToViewportPoint({
				clientX: currentRect.left,
				clientY: currentRect.top
			});

			const nextRegionPixels = getRegionPixels(nextRegion, cellSize);

			// Apply the animation
			Object.assign(element.style, {
				position: 'absolute',
				width: `${nextRegionPixels.width}px`,
				height: `${nextRegionPixels.height}px`,
				transform: `translate(${nextRegionPixels.x - left}px, ${nextRegionPixels.y - top}px)`,
				transition: 'transform 0.5s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out'
			});

			// Switch back to grid positioning after animation
			const onTransitionEnd = () => {
				element.style.position = 'relative';
				element.style.transform = '';
				element.style.transition = '';
				element.style.gridArea = `${nextRegion.start.row + 1} / ${nextRegion.start.col + 1} / span ${nextRegion.dimension.height} / span ${nextRegion.dimension.width}`;
				setCurrentRegion(nextRegion);
				element.removeEventListener('transitionend', onTransitionEnd);
			};

			element.addEventListener('transitionend', onTransitionEnd);
		}
	}, [currentRegion, nextRegion, cellSize, widgetGrid]);

	if (currentRegion == null) {
		return null;
	}

	return (
		<div
			ref={elementRef}
			key={`${widget.id}-${index}`}
			style={{
				position: 'relative',
				gridArea: `${currentRegion.start.row + 1} / ${currentRegion.start.col + 1} / span ${currentRegion.dimension.height} / span ${currentRegion.dimension.width}`,
				// Required for the transition animation to work
				width: currentRegionPixels?.width,
				height: currentRegionPixels?.height
			}}
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
