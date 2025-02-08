import { TWidgetBaseData, TWidgetGrid } from './types';

export function isWidgetGrid<GData extends TWidgetBaseData>(
	value: unknown
): value is TWidgetGrid<GData, []> {
	return typeof value === 'object' && value != null && '_features' in value && '_widgets' in value;
}
