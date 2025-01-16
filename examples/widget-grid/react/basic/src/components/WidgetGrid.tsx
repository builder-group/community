import { useFeatureState, useListener } from 'feature-react/state';
import React from 'react';
import { TWidgetBaseContent, TWidgetGrid } from 'widget-grid';
import { useBoundingRectObserver } from '../hooks';
import { TWidgetWrapperProps, WidgetWrapper } from './WidgetWrapper';

export const WidgetGrid = <GContent extends TWidgetBaseContent>(
	props: TWidgetGridProps<GContent>
) => {
	const { widgetGrid, renderItem } = props;
	const { rows, columns } = useFeatureState(widgetGrid._size);
	const { width: cellWidth, height: cellHeight } = useFeatureState(widgetGrid.cellSize);
	const widgetGridRef = React.useRef<HTMLDivElement>(null);

	useBoundingRectObserver(widgetGridRef, widgetGrid.boundingRect);

	// TODO: REMOVE
	useListener(widgetGrid.interactionMode, ({ value, source, background }) => {
		console.log(`[interactionMode] s: ${source}${background ? ' b: true' : ''}`, value);
	});
	useListener(widgetGrid._selected, ({ value, source, background }) => {
		console.log(`[selectedWidgets] s: ${source}${background ? ' b: true' : ''}`, value);
	});
	useListener(widgetGrid.getWidgetById('1')?.region, ({ value, source, background }) => {
		console.log(`[Widget 1 Region] s: ${source}${background ? ' b: true' : ''}`, value);
	});
	useListener(widgetGrid.getWidgetById('1')?.position, ({ value, source, background }) => {
		console.log(`[Widget 1 Position] s: ${source}${background ? ' b: true' : ''}`, value);
	});

	// =========================================================================
	// Effects
	// =========================================================================

	const handlePointerMove = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>): void => {
			event.preventDefault();

			switch (widgetGrid.interactionMode._v.type) {
				case 'Translating': {
					const { currentPosition } = widgetGrid.interactionMode._v;
					const cursorPosition = widgetGrid.pointerEventToViewportPoint(event);

					const deltaX = cursorPosition.x - currentPosition.x;
					const deltaY = cursorPosition.y - currentPosition.y;

					for (const widget of widgetGrid.getSelectedWidgets()) {
						widget.position.set(
							(n) => ({
								x: (n?.x ?? 0) + deltaX,
								y: (n?.y ?? 0) + deltaY
							}),
							{ additionalData: { source: 'translate' } }
						);

						const pos = widget.position._v;
						const region = widget.region._v;
						if (pos == null || region == null) {
							continue;
						}

						const newCol = Math.round(pos.x / cellWidth);
						const newRow = Math.round(pos.y / cellHeight);
						if (newCol !== region.start.col || newRow !== region.start.row) {
							widgetGrid.moveWidget(widget.id, {
								col: newCol,
								row: newRow
							});
						}
					}

					widgetGrid.interactionMode._v.currentPosition = cursorPosition;
					break;
				}
				default:
				// do nothing
			}
		},
		[widgetGrid, cellWidth, cellHeight]
	);

	const handlePointerUp = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>): void => {
			event.preventDefault();

			widgetGrid.interactionMode.set({ type: 'None' });
		},
		[widgetGrid]
	);

	// =========================================================================
	// Render
	// =========================================================================

	return (
		<div
			id="widget-grid"
			ref={widgetGridRef}
			style={{
				position: 'relative',
				width: columns * cellWidth,
				height: rows * cellHeight,
				display: 'grid',
				gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`,
				gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
				gap: '0px'
			}}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			{Object.values(widgetGrid._widgets).map((widget, index) => (
				<WidgetWrapper
					key={widget.id}
					index={index}
					widget={widget}
					renderItem={renderItem}
					widgetGrid={widgetGrid}
				/>
			))}
		</div>
	);
};

interface TWidgetGridProps<GContent> {
	widgetGrid: TWidgetGrid<GContent, []>;
	renderItem: TWidgetWrapperProps<GContent>['renderItem'];
}
