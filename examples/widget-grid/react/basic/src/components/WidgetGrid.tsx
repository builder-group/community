import { useFeatureState, useListener } from 'feature-react/state';
import React from 'react';
import {
	gridToString,
	TGridPosition,
	TWidgetBaseContent,
	TWidgetGrid,
	TWidgetId
} from 'widget-grid';
import { useBoundingRectObserver } from '../hooks';
import { TWidgetWrapperProps, WidgetWrapper } from './WidgetWrapper';

export const WidgetGrid = <GContent extends TWidgetBaseContent>(
	props: TWidgetGridProps<GContent>
) => {
	const { widgetGrid, renderItem } = props;
	const { rows, cols } = useFeatureState(widgetGrid._size);
	const { cell, gap } = useFeatureState(widgetGrid.layout);
	const widgetGridRef = React.useRef<HTMLDivElement>(null);
	const pendingMovesRef = React.useRef<
		Record<TWidgetId, { position: TGridPosition; timeout: number }>
	>({});

	useBoundingRectObserver(widgetGridRef, widgetGrid.boundingRect);

	// TODO: REMOVE
	useListener(widgetGrid.interactionMode, ({ value, source, background }) => {
		console.log(`[interactionMode] s: ${source}${background ? ' b: true' : ''}`, value);
	});
	useListener(widgetGrid._selected, ({ value, source, background }) => {
		console.log(`[selectedWidgets] s: ${source}${background ? ' b: true' : ''}`, value);
	});
	useListener(widgetGrid._cells, () => {
		console.log(gridToString(widgetGrid._cells._v));
	});

	// TODO: REMOVE
	// useListener(widgetGrid.getWidgetById('A')?.region, ({ value, source, background }) => {
	// 	console.log(`[Widget A Region] s: ${source}${background ? ' b: true' : ''}`, value);
	// });
	// useListener(widgetGrid.getWidgetById('A')?.position, ({ value, source, background }) => {
	// 	console.log(`[Widget A Position] s: ${source}${background ? ' b: true' : ''}`, value);
	// });

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
							{ listenerContext: { source: 'WidgetGrid_translate' } }
						);

						const pos = widget.position._v;
						const region = widget.region._v;
						if (pos == null || region == null) {
							continue;
						}

						const newCol = Math.round(pos.x / cell.width);
						const newRow = Math.round(pos.y / cell.height);

						if (newCol !== region.start.col || newRow !== region.start.row) {
							const pendingMove = pendingMovesRef.current[widget.id];

							// If the intended position is different from the pending position, create new timeout
							if (
								pendingMove == null ||
								pendingMove.position.col !== newCol ||
								pendingMove.position.row !== newRow
							) {
								// Clear any existing timeout for this widget
								if (pendingMove != null) {
									clearTimeout(pendingMove.timeout);
								}

								const timeoutId = setTimeout(() => {
									widgetGrid.moveWidget(widget.id, {
										col: newCol,
										row: newRow
									});
									delete pendingMovesRef.current[widget.id];
								}, 200);

								pendingMovesRef.current[widget.id] = {
									position: { col: newCol, row: newRow },
									timeout: timeoutId
								};
							}
						}
					}

					widgetGrid.interactionMode._v.currentPosition = cursorPosition;
					break;
				}
				default:
				// do nothing
			}
		},
		[widgetGrid, cell]
	);

	const handlePointerUp = React.useCallback(
		(event: React.PointerEvent<HTMLDivElement>): void => {
			event.preventDefault();

			// Clear all pending moves when pointer is released
			Object.values(pendingMovesRef.current).forEach(({ timeout }) => {
				window.clearTimeout(timeout);
			});
			pendingMovesRef.current = {};

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
				width: cols * cell.width,
				height: rows * cell.height,
				display: 'grid',
				gridTemplateColumns: `repeat(${cols}, ${cell.width}px)`,
				gridTemplateRows: `repeat(${rows}, ${cell.height}px)`,
				gap: `${gap.width}px ${gap.height}px`
			}}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
		>
			{Object.values(widgetGrid._widgets).map((widget, index) => (
				<WidgetWrapper key={widget.id} index={index} widget={widget} renderItem={renderItem} />
			))}
		</div>
	);
};

interface TWidgetGridProps<GContent> {
	widgetGrid: TWidgetGrid<GContent, []>;
	renderItem: TWidgetWrapperProps<GContent>['renderItem'];
}
