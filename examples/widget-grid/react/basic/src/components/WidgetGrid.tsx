import React from 'react';
import { TGridDimension, TGridPosition, TWidgetGrid, TWidgetGridBaseItem } from 'widget-grid';

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
			{regions.map(({ widgetId, start, dimension }, index) => {
				const widget = widgetGrid.getWidgetById(widgetId);
				if (!widget) return null;

				return (
					<div
						key={`${widgetId}-${index}`}
						style={{
							gridArea: `${start.row + 1} / ${start.col + 1} / span ${dimension.height} / span ${dimension.width}`,
							transition: 'grid-area 0.3s ease-in-out'
						}}
					>
						{renderItem({ ...widget, dimension, start })}
					</div>
				);
			})}
		</div>
	);
};

interface TWidgetGridProps<GItem extends TWidgetGridBaseItem> {
	widgetGrid: TWidgetGrid<GItem, []>;
	renderItem: (
		item: GItem & { dimension: TGridDimension; start: TGridPosition }
	) => React.ReactNode;
	cellSize?: number;
}
