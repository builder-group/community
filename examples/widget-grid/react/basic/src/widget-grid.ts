import { createWidgetGrid, TWidgetGridBaseItem } from 'widget-grid';

export const widgetGrid = createWidgetGrid<TItem>({
	grid: [
		['1', '1', '2', '3'],
		['1', '1', '2', '3'],
		['-', '5', '4', '2']
	],
	items: {
		'1': { id: '1', type: 'item1' },
		'2': { id: '2', type: 'item2' },
		'3': { id: '3', type: 'item3' },
		'4': { id: '4', type: 'item2' },
		'5': { id: '5', type: 'item1' }
	}
});

export type TItem = TItem1 | TItem2 | TItem3;

interface TItem1 extends TWidgetGridBaseItem {
	type: 'item1';
}

interface TItem2 extends TWidgetGridBaseItem {
	type: 'item2';
}

interface TItem3 extends TWidgetGridBaseItem {
	type: 'item3';
}
