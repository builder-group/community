import { createComponentRegistry, TComponentRegistry } from './component-registry';
import { createEntityIndex, TEntityId, TEntityIndex } from './entity-index';

export function createWorld(): TWorld {
	return {
		_entityIndex: createEntityIndex(),
		_componentRegistry: createComponentRegistry(),

		addEntity() {
			return this._entityIndex.addEntity();
		},

		removeEntity(eid) {
			if (!this._entityIndex.isEntityAlive(eid)) {
				return false;
			}

			// Remove all components from entity
			this._componentRegistry.removeAllComponents(eid);

			// Remove entity from index
			return this._entityIndex.removeEntity(eid);
		},

		doesEntityExist(eid) {
			return this._entityIndex.isEntityAlive(eid);
		},

		reset() {
			this._entityIndex.reset();
			this._componentRegistry.reset();
		}
	};
}

export interface TWorld {
	_entityIndex: TEntityIndex;
	_componentRegistry: TComponentRegistry;

	addEntity(): TEntityId;
	removeEntity(eid: TEntityId): boolean;
	doesEntityExist(eid: TEntityId): boolean;

	reset(): void;
}
