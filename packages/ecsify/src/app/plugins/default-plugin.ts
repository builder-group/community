import { TEntityId } from '../../entity';
import { With } from '../../query';
import { TApp, TAppContext, TPlugin } from '../types';

export function createDefaultPlugin(): TDefaultPlugin {
	return {
		name: 'Default',
		deps: [],
		components: {
			Removed: {}
		},
		appExtensions: {
			markEntityForRemoval(this: TApp<TAppContext<[TDefaultPlugin]>>, eid: TEntityId) {
				this.addComponent(eid, this.c.Removed);
			}
		},
		setup: (app: TApp<TAppContext<[TDefaultPlugin]>>) => {
			app.addSystem(cleanupSystem, {
				set: 'Flush'
			});
		}
	};
}

const cleanupSystem = (app: TApp<TAppContext<[TDefaultPlugin]>>) => {
	// Remove entities marked for removal
	for (const eid of app.queryEntities(With(app.c.Removed))) {
		app.destroyEntity(eid);
	}

	// Flush the app (e.g. to clear changes from this frame)
	app.flush();
};

export type TDefaultPlugin = TPlugin<
	{
		name: 'Default';
		components: {
			// Markers
			Removed: TCRemoved;
		};
		appExtensions: {
			/**
			 * Mark an entity for removal.
			 * @param eid - The entity ID to mark for removal
			 */
			markEntityForRemoval(eid: TEntityId): void;
		};
		systemSets: 'First' | 'Update' | 'Last' | 'Flush';
	},
	[]
>;

export type TCRemoved = {};
