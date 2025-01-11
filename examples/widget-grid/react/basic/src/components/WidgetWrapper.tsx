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
	const isSelected = useFeatureState(widget.isSelected);

	const nextRegion = useFeatureState(widget.region);
	const [currentRegion, setCurrentRegion] = React.useState(nextRegion);
	const currentRegionPixels = React.useMemo(
		() => (currentRegion != null ? getRegionPixels(currentRegion, cellSize) : null),
		[currentRegion, cellSize]
	);

	const count = useRenderCount();
	const elementRef = React.useRef<HTMLDivElement>(null);

	// =========================================================================
	// Events
	// =========================================================================

	const handlePointerDown = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			event.preventDefault();

			if (widget.isLocked._v) {
				return;
			}

			switch (event.button) {
				case 0: {
					// Prevent event bubbling to Board listener (may be needed later for nested selection support)
					event.stopPropagation();

					// Add to selection if Shift key is pressed
					if (event.shiftKey) {
						widgetGrid.select([widget.id], true);
					}
					// Set as only selection if no other nodes are selected
					else if (widgetGrid._selected._v.length <= 1) {
						widgetGrid.select([widget.id], false);
					}

					const origin = widgetGrid.pointerEventToViewportPoint(event);
					widgetGrid.interactionMode.set({
						type: 'Translating',
						originPosition: origin,
						currentPosition: origin
					});
					break;
				}
				default:
				// do nothing
			}
		},
		[widgetGrid, widget]
	);

	const handlePointerUp = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			event.preventDefault();

			if (widget.isLocked._v) {
				return;
			}

			switch (event.button) {
				case 0: {
					// If not holding Shift, in 'Translating' mode,
					// and the pointer hasn't moved, select only the current node
					if (
						!event.shiftKey &&
						widgetGrid.interactionMode._v.type === 'Translating' &&
						widgetGrid.interactionMode._v.originPosition.x ===
							widgetGrid.interactionMode._v.currentPosition.x &&
						widgetGrid.interactionMode._v.originPosition.y ===
							widgetGrid.interactionMode._v.currentPosition.y
					) {
						widgetGrid.select([widget.id], false);
					}
					break;
				}
				default:
				// do nothing
			}
		},
		[widgetGrid, widget]
	);

	// =========================================================================
	// Effefcts
	// =========================================================================

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
			element.style.gridArea = `${nextRegion.start.row + 1} / ${nextRegion.start.col + 1} / span ${nextRegion.dimension.height} / span ${nextRegion.dimension.width}`; // To avoid flickering to current region
			setCurrentRegion(nextRegion); // Update current region after animation
			element.removeEventListener('transitionend', handleTransitionEnd);
		};

		element.addEventListener('transitionend', handleTransitionEnd);
	}, [currentRegion, nextRegion, widgetGrid, cellSize, isLargeGrid]);

	// Hide widget if no region is available
	if (currentRegion == null) {
		return null;
	}

	// =========================================================================
	// Render
	// =========================================================================

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
			<div
				style={{
					position: 'absolute',
					top: 0,
					left: 0,
					backgroundColor: isSelected ? 'green' : 'white'
				}}
			>
				{count}
			</div>
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
