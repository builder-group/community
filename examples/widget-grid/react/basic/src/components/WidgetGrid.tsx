import { useFeatureState } from 'feature-react/state';
import React from 'react';
import { TWidgetBaseContent, TWidgetGrid } from 'widget-grid';
import { useBoundingRectObserver } from '../hooks';
import { TWidgetWrapperProps, WidgetWrapper } from './WidgetWrapper';

export const WidgetGrid = <GContent extends TWidgetBaseContent>(
	props: TWidgetGridProps<GContent>
) => {
	const { widgetGrid, renderItem } = props;
	const { rows, columns } = useFeatureState(widgetGrid.size);
	const { width: cellWidth, height: cellHeight } = useFeatureState(widgetGrid.cellSize);
	const widgetGridRef = React.useRef<HTMLDivElement>(null);

	useBoundingRectObserver(widgetGridRef, widgetGrid.boundingRect);

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
