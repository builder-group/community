import { useFeatureState } from 'feature-react/state';
import React from 'react';
import { getRegionPixels, TWidget, TWidgetBaseContent, TWidgetGrid } from 'widget-grid';
import { useRenderCount } from '../hooks';

export const WidgetWrapper = <GContent extends TWidgetBaseContent>(
	props: TWidgetWrapperProps<GContent>
) => {
	const { renderItem, index, widget, widgetGrid } = props;
	const cellSize = useFeatureState(widgetGrid.cellSize);
	const isLargeGrid = React.useMemo(() => {
		return widgetGrid.size._v.columns * widgetGrid.size._v.rows > 500;
	}, [widgetGrid.size]);

	const nextRegion = useFeatureState(widget.region);
	const [currentRegion, setCurrentRegion] = React.useState(nextRegion);
	const currentRegionPixels = React.useMemo(
		() => (currentRegion != null ? getRegionPixels(currentRegion, cellSize) : null),
		[currentRegion, cellSize]
	);

	const count = useRenderCount();
	const elementRef = React.useRef<HTMLDivElement>(null);

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

	// Animate the transition between current and next region
	React.useEffect(() => {
		if (nextRegion == null || isLargeGrid) {
			setCurrentRegion(nextRegion);
			return;
		}

		const element = elementRef.current;
		if (element == null) {
			return;
		}

		// Calculate current position and offset
		const currentRect = element.getBoundingClientRect();
		const { x: currentX, y: currentY } = widgetGrid.pointerEventToViewportPoint({
			clientX: currentRect.left,
			clientY: currentRect.top
		});

		const nextRegionPixels = getRegionPixels(nextRegion, cellSize);

		// Apply animation styles
		Object.assign(element.style, {
			position: 'absolute',
			width: `${nextRegionPixels.width}px`,
			height: `${nextRegionPixels.height}px`,
			transform: `translate(${nextRegionPixels.x - currentX}px, ${nextRegionPixels.y - currentY}px)`,
			transition: 'transform 0.5s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out'
		});

		// Handle transition end
		const handleTransitionEnd = () => {
			element.style.position = 'relative';
			element.style.transform = '';
			element.style.transition = '';
			element.style.gridArea = `${nextRegion.start.row + 1} / ${nextRegion.start.col + 1} / span ${nextRegion.dimension.height} / span ${nextRegion.dimension.width}`;
			setCurrentRegion(nextRegion); // Update current region after animation
			element.removeEventListener('transitionend', handleTransitionEnd);
		};

		element.addEventListener('transitionend', handleTransitionEnd);
	}, [currentRegion, nextRegion, widgetGrid, cellSize, isLargeGrid]);

	// Hide widget if no region is available
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
			<div style={{ position: 'absolute', top: 0, left: 0 }}>{count}</div>
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
