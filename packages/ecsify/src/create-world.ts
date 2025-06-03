import { withNew } from '@blgc/utils';
import {
	createComponentRegistry,
	TComponentRef,
	TComponentRegistry,
	TUpdateComponentValue
} from './component';
import type { TComponentValue } from './component/types';
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
 * // Define components
 * const Position = { x: [], y: [] };    // AoS pattern
 * const Health = [];                    // Single value array
 * const Player = {};                    // Marker component
 *
 * // Create entities and add components with values
 * const entity = world.createEntity();
 * world.addComponent(entity, Position, { x: 10, y: 20 });
 * world.addComponent(entity, Health, 100);
 * world.addComponent(entity, Player, true);
 *
 * // Update component values
 * world.updateComponent(entity, Position, { x: 15 });               // Partial AoS update (y unchanged)
 * world.updateComponent(entity, Health, 90, true);                  // Update & mark changed
 * world.updateComponent(entity, Player, false);                     // Remove marker component
 * world.updateComponent(entity, Player, true);                      // Add marker component back
 *
 * // Query entities
 * const entities = world.queryEntities(And(With(Position), With(Health)));
 * ```
 */
export function createWorld(): TWorld {
	return withNew({
		_componentRegistry: createComponentRegistry(),
		_entityIndex: createEntityIndex(),
		_queryRegistry: null as any, // Will be set in _new

		_new() {
			this._queryRegistry = createQueryRegistry(this);
		},

		createEntity() {
			return this._entityIndex.addEntity();
		},

		destroyEntity(eid) {
			this._componentRegistry.removeAllComponents(eid);
			this._entityIndex.removeEntity(eid);
		},

		addComponent<GComponent extends TComponentRef>(
			eid: TEntityId,
			component: GComponent,
			value?: TComponentValue<GComponent>
		): void {
			this._componentRegistry.addComponent(eid, component, value);
		},

		updateComponent<GComponent extends TComponentRef>(
			eid: TEntityId,
			component: GComponent,
			value: TUpdateComponentValue<GComponent>,
			markAsChanged?: boolean
		): void {
			this._componentRegistry.updateComponent(eid, component, value, markAsChanged);
		},

		removeComponent(eid, component) {
			return this._componentRegistry.removeComponent(eid, component);
		},

		hasComponent(eid, component) {
			return this._componentRegistry.hasComponent(eid, component);
		},

		markComponentChanged(eid, component) {
			return this._componentRegistry.markChanged(eid, component);
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
	 * Adds a component to an entity with initial data.
	 * @param eid - The entity ID
	 * @param component - The component to add
	 * @param value - Initial component data
	 */
	addComponent<GComponent>(
		eid: TEntityId,
		component: GComponent,
		value: TComponentValue<GComponent>
	): void;

	/**
	 * Updates a component for an entity.
	 * - For arrays: sets value directly
	 * - For marker components (empty objects): true adds component, false removes it
	 * - For objects with arrays: sets each property value (supports partial updates)
	 * @param eid - The entity ID
	 * @param component - The component to update
	 * @param value - New component data (partial for AoS, boolean for marker components)
	 * @param markAsChanged - Whether to mark the component as changed (default: true)
	 */
	updateComponent<T>(
		eid: TEntityId,
		component: T,
		value: TUpdateComponentValue<T>,
		markAsChanged?: boolean
	): void;

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
	 * Marks a component as changed for the current frame.
	 * @param eid - The entity ID
	 * @param component - The component to mark as changed
	 */
	markComponentChanged(eid: TEntityId, component: TComponentRef): void;

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
