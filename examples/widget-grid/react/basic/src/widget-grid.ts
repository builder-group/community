import { createWidgetGrid } from 'widget-grid';

export const widgetGrid = createWidgetGrid<TWidgetContent>({
	grid: [
		['1', '1', '2', '3'],
		['1', '1', '2', '3'],
		['-', '5', '4', '4']
	],
	widgets: [
		{ id: '1', content: { type: 'item1' } },
		{ id: '2', content: { type: 'item2' } },
		{ id: '3', content: { type: 'item3' } },
		{ id: '4', content: { type: 'item2' } },
		{ id: '5', content: { type: 'item1' } }
	]
});

export type TWidgetContent = TWidgetContent1 | TWidgetContent2 | TWidgetContent3;

interface TWidgetContent1 {
	type: 'item1';
}

interface TWidgetContent2 {
	type: 'item2';
}

interface TWidgetContent3 {
	type: 'item3';
}
