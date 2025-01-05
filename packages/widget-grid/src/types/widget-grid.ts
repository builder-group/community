import { TFeatureDefinition, TWithFeatures } from '@blgc/types/features';

export type TWidgetGrid<GFeatures extends TFeatureDefinition[]> = TWithFeatures<
	{
		_data: TWidgetGridData;
		getDimensions: () => { width: number; height: number };
		getWidgetAt: (row: number, col: number) => TWidgetData | null;
		getWidgetById: (id: string) => TWidgetData | null;
	},
	GFeatures
>;

export type TWidgetData = {
	id: string;
	type: string;
	config?: Record<string, unknown>;
};

export type TWidgetGridData = {
	grid: string[][]; // 2D array storing widget IDs
	widgets: Record<string, TWidgetData>; // Map of widget ID to widget data
	columns: number;
	rows: number;
};
