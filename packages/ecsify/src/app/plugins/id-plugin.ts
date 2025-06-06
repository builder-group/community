import { TEntityId } from '../../entity';
import { TApp, TAppContext, TPlugin } from '../types';

export function createIdPlugin(): TIdPlugin {
	return {
		name: 'Id',
		deps: [],
		components: {
			IdMixin: []
		},
		resources: {
			idMap: new Map()
		},
		appExtensions: {
			getEntityById(this: TApp<TAppContext<[TIdPlugin]>>, id: TCIdMixinId): TEntityId | null {
				return this.r.idMap.get(id) ?? null;
			}
		},
		setup: (app: TApp<TAppContext<[TIdPlugin]>>) => {
			app._componentRegistry.onComponentAdd(app.c.IdMixin, (eid: TEntityId) => {
				const idComponent = app.c.IdMixin[eid];
				if (idComponent != null) {
					app.r.idMap.set(idComponent.id, eid);
				}
			});

			app._componentRegistry.onComponentRemove(app.c.IdMixin, (eid: TEntityId) => {
				const idComponent = app.c.IdMixin[eid];
				if (idComponent != null) {
					app.r.idMap.delete(idComponent.id);
				}
			});
		}
	};
}

export type TIdPlugin = TPlugin<
	{
		name: 'Id';
		components: {
			// Mixins
			IdMixin: TCIdMixin[];
		};
		resources: {
			idMap: Map<TCIdMixinId, TEntityId>;
		};
		appExtensions: {
			getEntityById(id: TCIdMixinId): TEntityId | null;
		};
	},
	[]
>;

export interface TCIdMixin {
	id: TCIdMixinId;
}
export type TCIdMixinId = string | number;
