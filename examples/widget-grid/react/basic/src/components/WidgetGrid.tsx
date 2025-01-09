import { TWidget, TWidgetGrid } from 'widget-grid';

export const WidgetGrid = <GContent extends any>(props: TWidgetGridProps<GContent>) => {
	const { widgetGrid, renderItem, cellSize = 96 } = props;
	const { rows, columns } = widgetGrid.getSize();

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
			{Object.values(widgetGrid._widgets).map((widget, index) => {
				if (widget.region == null) {
					return null;
				}

				return (
					<div
						key={`${widget.id}-${index}`}
						style={{
							gridArea: `${widget.region.start.row + 1} / ${widget.region.start.col + 1} / span ${widget.region.dimension.height} / span ${widget.region.dimension.width}`,
							transition: 'grid-area 0.3s ease-in-out'
						}}
					>
						{renderItem(widget)}
					</div>
				);
			})}
		</div>
	);
};

interface TWidgetGridProps<GContent> {
	widgetGrid: TWidgetGrid<GContent, []>;
	renderItem: (widget: TWidget<GContent>) => React.ReactNode;
	cellSize?: number;
}
