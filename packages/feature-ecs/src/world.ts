import { withNew } from '@blgc/utils';
import { createComponentRegistry, TComponentRef, TComponentRegistry } from './component-registry';
import { createEntityIndex, TEntityId, TEntityIndex } from './entity-index';
import { TQueryFilter } from './query-filter';
import { createQueryRegistry, TQueryRegistry } from './query-registry';

export function createWorld(): TWorld {
	return withNew({
		_entityIndex: createEntityIndex(),
		_componentRegistry: createComponentRegistry(),
		_queryRegistry: null as unknown as TQueryRegistry,

		_new() {
			this._queryRegistry = createQueryRegistry(this);
		},

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

		markChanged(eid: TEntityId, component: TComponentRef) {
			return this._componentRegistry.markChanged(eid, component);
		},

		clear() {
			this._componentRegistry.clear();
		},

		query(filter) {
			return this._queryRegistry.executeQuery(filter);
		},

		innerQuery(filter) {
			return this._queryRegistry.executeInnerQuery(filter);
		},

		reset() {
			this._entityIndex.reset();
			this._componentRegistry.reset();
			this._queryRegistry.reset();
		}
	});
}

export interface TWorld {
	_entityIndex: TEntityIndex;
	_componentRegistry: TComponentRegistry;
	_queryRegistry: TQueryRegistry;

	addEntity(): TEntityId;
	removeEntity(eid: TEntityId): boolean;
	doesEntityExist(eid: TEntityId): boolean;

	/**
	 * Marks a component as changed for the current frame.
	 * @param eid - The entity ID
	 * @param component - The component to mark as changed
	 * @returns True if component was marked as changed, false if entity didn't have it
	 */
	markChanged(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Clears all change tracking for the current frame.
	 * Should be called at the end of each frame/update cycle.
	 */
	clear(): void;

	/**
	 * Execute a query and return matching entities.
	 * Commits pending removals before execution.
	 * @param filter - The query filter
	 * @returns Array of matching entity IDs
	 */
	query(filter: TQueryFilter): TEntityId[];

	/**
	 * Execute a query without committing removals.
	 * Used for nested queries during iteration.
	 * @param filter - The query filter
	 * @returns Array of matching entity IDs
	 */
	innerQuery(filter: TQueryFilter): TEntityId[];

	reset(): void;
}
