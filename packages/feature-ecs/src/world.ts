import { withNew } from '@blgc/utils';
import { createComponentRegistry, TComponentRef, TComponentRegistry } from './component';
import { createEntityIndex, TEntityId, TEntityIndex } from './entity';
import {
	createQueryRegistry,
	TComponentDataTuple,
	TExecuteQueryOptions,
	TQueryFilter,
	TQueryRegistry
} from './query';
import { TEntity } from './query/types';

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
			return this._entityIndex.addEntity();
		},

		destroyEntity(eid) {
			this._componentRegistry.removeAllComponents(eid);
			this._entityIndex.removeEntity(eid);
		},

		addComponent(eid, component) {
			this._componentRegistry.addComponent(eid, component);
		},

		removeComponent(eid, component) {
			return this._componentRegistry.removeComponent(eid, component);
		},

		hasComponent(eid, component) {
			return this._componentRegistry.hasComponent(eid, component);
		},

		queryEntities(filter, options) {
			return this._queryRegistry.queryEntities(filter, options);
		},

		queryComponents(components, filter) {
			return this._queryRegistry.queryComponents(components, filter);
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
	 * Queries entities that match the specified filter and returns only entity IDs.
	 *
	 * @param filter - The query filter to match entities against
	 * @param options - Query execution options
	 * @returns Array of entity IDs that match the filter
	 *
	 * @example
	 * ```typescript
	 * // Simple component query
	 * const entities = world.queryEntities(With(Position));
	 *
	 * // Complex query with multiple conditions
	 * const movingEntities = world.queryEntities(
	 *   And(With(Position), With(Velocity), Without(Dead))
	 * );
	 * ```
	 */
	queryEntities(filter: TQueryFilter, options?: TExecuteQueryOptions): TEntityId[];

	/**
	 * Queries components and returns matching entities with component data.
	 *
	 * @param components Components to retrieve data from (include Entity for entity ID)
	 * @param filter Optional filter to restrict results
	 * @returns Array of component data tuples. Entities without all requested components are excluded.
	 * @example
	 * ```ts
	 * // Query for entities with both Position and Velocity, include entity ID
	 * const results = world.queryComponents([Entity, Position, Velocity]);
	 * // Returns: [[eid1, {x: 10, y: 5}, {x: 2, y: 1}], [eid2, {x: 20, y: 15}, {x: 1, y: -1}]]
	 *
	 * // Query with filter
	 * const playerResults = world.queryComponents([Entity, Health], With(Player));
	 * // Returns: [[eid1, 100], [eid3, 75]]
	 * ```
	 */
	queryComponents<T extends readonly (TComponentRef | TEntity)[]>(
		components: T,
		filter?: TQueryFilter
	): TComponentDataTuple<T>[];

	/**
	 * Clears the world.
	 */
	flush(): void;

	/**
	 * Resets the world to its initial state.
	 */
	reset(): void;
}
