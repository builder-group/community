import { createEntityIndex, TEntityId, TEntityIndex } from './entity-index';

export function createWorld(): TWorld {
	return {
		entityIndex: createEntityIndex(),

		addEntity() {
			return this.entityIndex.addEntity();
		},

		reset() {
			this.entityIndex.reset();
		}
	};
}

export interface TWorld {
	entityIndex: TEntityIndex;

	addEntity(): TEntityId;

	reset(): void;
}
