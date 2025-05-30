import { withNew } from '@blgc/utils';
import { createComponentRegistry, TComponentRef, TComponentRegistry } from './component';
import { createEntityIndex, TEntityId, TEntityIndex } from './entity';
import { createQueryRegistry, TExecuteQueryOptions, TQueryFilter, TQueryRegistry } from './query';

// TODO:
// Events
// Systems
// Resources

/**
 * Creates a new ECS world.
 *
 * @returns A new world instance with component registry, entity index, and query registry
 *
 * @example
 * ```typescript
 * const world = createWorld();
 *
 * // Create entities and add components
 * const entity = world.createEntity();
 * world.addComponent(entity, Position);
 * world.addComponent(entity, Velocity);
 *
 * // Query entities
 * const entities = world.query(And(With(Position), With(Velocity)));
 * ```
 */
export function createWorld(): TWorld {
	return withNew({
		_componentRegistry: createComponentRegistry(),
		_entityIndex: createEntityIndex(),
		_queryRegistry: null as any, // Will be set in _new

		_new() {
			const queryRegistry = createQueryRegistry(this);
			this._queryRegistry = queryRegistry;
		},

		createEntity() {
			const eid = this._entityIndex.addEntity();
			return eid;
		},

		destroyEntity(eid) {
			this._componentRegistry.removeAllComponents(eid);
			this._entityIndex.removeEntity(eid);
		},

		addComponent(eid, component) {
			this._componentRegistry.addComponent(eid, component);
		},

		removeComponent(eid, component) {
			const result = this._componentRegistry.removeComponent(eid, component);
			return result;
		},

		hasComponent(eid, component) {
			return this._componentRegistry.hasComponent(eid, component);
		},

		query(filter, options) {
			return this._queryRegistry.executeQuery(filter, options);
		},

		flush() {
			this._componentRegistry.flush();
		},

		reset() {
			this._componentRegistry.reset();
			this._entityIndex.reset();
			this._queryRegistry.reset();
		}
	});
}

export interface TWorld {
	/** Component registry for managing component data */
	_componentRegistry: TComponentRegistry;
	/** Entity index for managing entity lifecycle */
	_entityIndex: TEntityIndex;
	/** Query registry for efficient entity queries */
	_queryRegistry: TQueryRegistry;

	/**
	 * Creates a new entity and returns its ID.
	 * @returns The new entity ID
	 */
	createEntity(): TEntityId;

	/**
	 * Destroys an entity and removes all its components.
	 * @param eid - The entity ID to destroy
	 */
	destroyEntity(eid: TEntityId): void;

	/**
	 * Adds a component to an entity.
	 * @param eid - The entity ID
	 * @param component - The component to add
	 */
	addComponent(eid: TEntityId, component: TComponentRef): void;

	/**
	 * Removes a component from an entity.
	 * @param eid - The entity ID
	 * @param component - The component to remove
	 * @returns True if component was removed, false if entity didn't have it
	 */
	removeComponent(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Checks if an entity has a specific component.
	 * @param eid - The entity ID
	 * @param component - The component to check
	 * @returns True if entity has the component
	 */
	hasComponent(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Executes a query and returns matching entities.
	 * @param filter - The query filter
	 * @param options - Query execution options
	 * @returns Array of matching entity IDs
	 */
	query(filter: TQueryFilter, options?: TExecuteQueryOptions): TEntityId[];

	/**
	 * Clears the world.
	 */
	flush(): void;

	/**
	 * Resets the world to its initial state.
	 */
	reset(): void;
}
