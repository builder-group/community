import { useFeatureState, useListener } from 'feature-react/state';
import React from 'react';
import { TWidget, TWidgetBaseContent } from 'widget-grid';
import { useRenderCount } from '../hooks';

export const WidgetWrapper = <GContent extends TWidgetBaseContent>(
	props: TWidgetWrapperProps<GContent>
) => {
	const { renderItem, index, widget } = props;
	const widgetGrid = React.useMemo(() => widget._widgetGrid, [widget]);
	const isSelected = useFeatureState(widget.isSelected);

	const [region, setRegion] = React.useState(widget.region._v);

	// TODO: Only update element via ref? So we don't re-render all the time?
	const layoutMode = useFeatureState(widget.layoutMode);
	const position = useFeatureState(widget.position);
	const size = useFeatureState(widget.size);

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
	useListener(
		widget.region,
		({ value: nextRegion, background, isMoved }) => {
			if (background) {
				return;
			}

			const isLargeGrid = widgetGrid._size._v.cols * widgetGrid._size._v.rows > 500;
			if (isLargeGrid || nextRegion == null || isMoved) {
				setRegion(nextRegion);
				return;
			}

			const element = elementRef.current;
			if (element == null) {
				return;
			}

			// Apply initial position based on prev region
			const regionPixels = region != null ? widgetGrid.getRegionPixels(region) : null;
			Object.assign(element.style, {
				position: 'absolute',
				width: `${regionPixels?.width}px`,
				height: `${regionPixels?.height}px`,
				transform: `translate(${regionPixels?.x}px, ${regionPixels?.y}px)`,
				gridArea: ''
			});

			//  Force a reflow to ensure the initial position is applied
			element.offsetHeight;

			// Enable transition and move to new position
			const nextRegionPixels = widgetGrid.getRegionPixels(nextRegion);
			Object.assign(element.style, {
				position: 'absolute',
				width: `${nextRegionPixels.width}px`,
				height: `${nextRegionPixels.height}px`,
				transform: `translate(${nextRegionPixels.x}px, ${nextRegionPixels.y}px)`,
				transition: 'transform 0.2s ease-in-out, width 0.2s ease-in-out, height 0.2s ease-in-out'
			});

			// Handle transition end
			const handleTransitionEnd = () => {
				element.style.position = 'relative';
				element.style.width = '';
				element.style.height = '';
				element.style.transform = '';
				element.style.transition = '';
				element.style.gridArea = `${nextRegion.start.row + 1} / ${nextRegion.start.col + 1} / span ${nextRegion.dimension.rows} / span ${nextRegion.dimension.cols}`; // To avoid flickering to current region
				setRegion(nextRegion); // Update region after animation
				element.removeEventListener('transitionend', handleTransitionEnd);
			};

			element.addEventListener('transitionend', handleTransitionEnd);
		},
		{ key: 'use-listener_WidgetWrapper' },
		[region, widget.region, widgetGrid]
	);

	// Hide widget if no region is available
	if (region == null) {
		return null;
	}

	// =========================================================================
	// Render
	// =========================================================================

	return (
		<div
			ref={elementRef}
			key={`${widget.id}-${index}`}
			style={
				layoutMode === 'Grid'
					? {
							position: 'relative',
							gridArea: `${region.start.row + 1} / ${region.start.col + 1} / span ${region.dimension.rows} / span ${region.dimension.cols}`
						}
					: {
							position: 'absolute',
							width: size?.width,
							height: size?.height,
							transform: `translate(${position?.x}px, ${position?.y}px)`,
							zIndex: 99
						}
			}
			onPointerDown={handlePointerDown}
			onPointerUp={handlePointerUp}
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
	renderItem: (widget: TWidget<GContent>) => React.ReactNode;
	index: number;
	widget: TWidget<GContent>;
}
