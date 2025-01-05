import { TFeatureDefinition, TWithFeatures } from '@blgc/types/features';

export type TWidgetGrid<
	GItem extends TWidgetGridBaseItem,
	GFeatures extends TFeatureDefinition[]
> = TWithFeatures<
	{
		_items: Record<TWidgetGridItemId, GItem>;
		_grid: string[][];
		getGridSize: () => { rows: number; columns: number };
		getWidgetAt: (row: number, col: number) => GItem | null;
		getWidgetById: (id: string) => GItem | null;
	},
	GFeatures
>;

export type TWidgetGridItemId = string;

export interface TWidgetGridBaseItem {
	id: TWidgetGridItemId;
}
