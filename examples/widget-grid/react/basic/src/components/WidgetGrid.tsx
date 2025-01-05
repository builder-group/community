import React from 'react';
import { TWidgetGrid } from 'widget-grid';

export const WidgetGrid: React.FC<TWidgetGridProps> = (props) => {
	const { widgetGrid } = props;
	const { width, height } = widgetGrid.getDimensions();

	return (
		<div
			style={{
				width,
				height,
				display: 'grid',
				gridTemplateColumns: `repeat(${widgetGrid._data.columns}, 96px)`,
				gridTemplateRows: `repeat(${widgetGrid._data.rows}, 96px)`,
				gap: '0px'
			}}
		>
			{widgetGrid._data.grid.map((row, rowIndex) =>
				row.map((widgetId, colIndex) => {
					const widget = widgetGrid.getWidgetById(widgetId);
					return (
						<div key={`${rowIndex}-${colIndex}`}>
							{/* Render widget based on type */}
							{widget?.type}
						</div>
					);
				})
			)}
		</div>
	);
};

interface TWidgetGridProps {
	widgetGrid: TWidgetGrid<[]>;
}
