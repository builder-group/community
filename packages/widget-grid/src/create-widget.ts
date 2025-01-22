import { TWithInit } from '@blgc/types/features';
import { createState } from 'feature-state';
import { TGridRegion } from './helper';
import {
	TBaseWidget,
	TDimensions,
	TWidget,
	TWidgetBaseContent,
	TWidgetGrid,
	TXYPosition
} from './types';

export function createWidget<GContent extends TWidgetBaseContent>(
	config: TCreateWidgetConfig<GContent>
): TWidget<GContent> {
	const widget: TWithInit<TWidget<GContent>> = {
		_widgetGrid: config.widgetGrid,
		id: config.baseWidget.id,
		content: createState(config.baseWidget.content as GContent),
		region: createState(config.region ?? null),
		layoutMode: createState<'Grid' | 'Absolute'>('Grid'),
		position: createState<TXYPosition | null>(null),
		size: createState<TDimensions | null>(null),
		isSelected: createState(config.baseWidget.selected ?? false),
		isLocked: createState(config.baseWidget.locked ?? false),

		init() {
			const regionPixels =
				this.region._v != null ? this._widgetGrid.getRegionPixels(this.region._v) : null;
			if (regionPixels != null) {
				this.position.set({ x: regionPixels.x, y: regionPixels.y });
				this.size.set({ width: regionPixels.width, height: regionPixels.height });
			}

			this.isSelected.listen(({ value }) => {
				if (value) {
					this.layoutMode.set('Absolute', { listenerContext: { source: 'widget_is-selected' } });
				} else {
					this.layoutMode.set('Grid', { listenerContext: { source: 'widget_is-selected' } });
				}
			});

			this.layoutMode.listen(() => {
				this.syncPosition();
			});

			// @ts-expect-error -- Remove init method after initialization
			delete this.init;
			return this;
		},

		syncPosition() {
			if (this.region._v != null) {
				const regionPixels = this._widgetGrid.getRegionPixels(this.region._v);
				this.position.set({
					x: regionPixels.x,
					y: regionPixels.y
				});
				this.size.set({
					width: regionPixels.width,
					height: regionPixels.height
				});
			}
		}
	};

	return widget.init();
}

export interface TCreateWidgetConfig<GContent extends TWidgetBaseContent> {
	baseWidget: TBaseWidget<GContent>;
	widgetGrid: TWidgetGrid<GContent, []>;
	region?: TGridRegion;
}
