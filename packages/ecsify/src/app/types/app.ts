import {
	TComponentRef,
	TComponentRegistry,
	TComponentValue,
	TUpdateComponentValue
} from '../../component';
import { TEntityId, TEntityIndex } from '../../entity';
import { TEventRegistry } from '../../event';
import {
	TComponentDataTuple,
	TEntity,
	TExecuteQueryOptions,
	TQueryFilter,
	TQueryRegistry
} from '../../query';
import { TSystemRegistry } from '../../system';
import { TExtractField } from '../../types';
import { TAnyPlugin } from '../types';
import { TMergePlugins } from './plugin';

export type TAppContext<GPlugins extends TAnyPlugin[] = []> = TInnerAppContext<
	TMergePlugins<GPlugins>
>;

export interface TInnerAppContext<GMergedPlugins extends Record<string, unknown> = {}> {
	components: TExtractField<GMergedPlugins, 'components', {}>;
	resources: TExtractField<GMergedPlugins, 'resources', {}>;
	events: TExtractField<GMergedPlugins, 'events', {}>;
	systemSets: TExtractField<GMergedPlugins, 'systemSets', never>;
	appExtensions: TExtractField<GMergedPlugins, 'appExtensions', {}>;
}

type TPluginsFromAppContext<GAppContext extends TAppContext> =
	GAppContext extends TAppContext<infer GPlugins> ? GPlugins : never;

export type TApp<GAppContext extends TAppContext = TAppContext> = GAppContext['appExtensions'] & {
	_pluginNames: string[];

	c: GAppContext['components'];
	r: GAppContext['resources'];

	/** Component registry for managing component data */
	_componentRegistry: TComponentRegistry;
	/** Entity index for managing entity lifecycle */
	_entityIndex: TEntityIndex;
	/** Query registry for efficient entity queries */
	_queryRegistry: TQueryRegistry;
	/** System registry for managing system data */
	_systemRegistry: TSystemRegistry<GAppContext['systemSets'], GAppContext>;
	/** Event registry for managing event data */
	_eventRegistry: TEventRegistry<GAppContext['events']>;

	/**
	 * Add a plugin to the app
	 * @param plugin - The plugin to add
	 * @returns The new app with the plugin added
	 */
	addPlugin<GNewPlugin extends TAnyPlugin>(
		plugin: GNewPlugin
	): TApp<TAppContext<[GNewPlugin, ...TPluginsFromAppContext<GAppContext>]>>;

	/**
	 * Add multiple plugins to the app
	 * @param plugins - The plugins to add
	 * @returns The new app with the plugins added
	 */
	addPlugins<GNewPlugins extends TAnyPlugin[]>(
		...plugins: GNewPlugins
	): TApp<TAppContext<[...GNewPlugins, ...TPluginsFromAppContext<GAppContext>]>>;

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
};
