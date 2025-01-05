import React from 'react';
import { TWidgetGrid } from 'widget-grid';

export const WidgetGrid: React.FC<TWidgetGridProps> = (props) => {
	const { widgetGrid } = props;
	const { rows, columns } = widgetGrid.getGridSize();

	return (
		<div
			style={{
				width: columns * 96,
				height: rows * 96,
				display: 'grid',
				gridTemplateColumns: `repeat(${columns}, 96px)`,
				gridTemplateRows: `repeat(${rows}, 96px)`,
				gap: '0px'
			}}
		>
			{widgetGrid._grid.map((row, rowIndex) =>
				row.map((widgetId, colIndex) => {
					const widget = widgetGrid.getWidgetById(widgetId);
					return (
						<div key={`${rowIndex}-${colIndex}`}>
							{/* Render widget based on type */}
							{widget?.id}
						</div>
					);
				})
			)}
		</div>
	);
};

interface TWidgetGridProps {
	widgetGrid: TWidgetGrid<any, []>;
}
