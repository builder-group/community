import React from 'react';
import { TWidgetGrid, TWidgetGridBaseItem } from 'widget-grid';

export const WidgetGrid = <GItem extends TWidgetGridBaseItem>(props: TWidgetGridProps<GItem>) => {
	const { widgetGrid, renderItem, cellSize = 96 } = props;
	const { rows, columns } = widgetGrid.getGridSize();
	const regions = widgetGrid.getWidgetRegions();

	return (
		<div
			style={{
				width: columns * cellSize,
				height: rows * cellSize,
				display: 'grid',
				gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
				gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
				gap: '0px'
			}}
		>
			{regions.map(({ widgetId, startRow, startCol, width, height }, index) => {
				const widget = widgetGrid.getWidgetById(widgetId);
				if (!widget) return null;

				return (
					<div
						key={`${widgetId}-${index}`}
						style={{
							gridArea: `${startRow + 1} / ${startCol + 1} / span ${height} / span ${width}`,
							transition: 'grid-area 0.3s ease-in-out'
						}}
					>
						{renderItem({ ...widget, width, height })}
					</div>
				);
			})}
		</div>
	);
};

interface TWidgetGridProps<GItem extends TWidgetGridBaseItem> {
	widgetGrid: TWidgetGrid<GItem, []>;
	renderItem: (item: GItem & { width: number; height: number }) => React.ReactNode;
	cellSize?: number;
}
