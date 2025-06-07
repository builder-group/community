import {
	TComponentRef,
	TComponentRegistry,
	TComponentValue,
	TUpdateComponentValue
} from '../../component';
import { TEntityId, TEntityIndex } from '../../entity';
import { TEvent, TEventRegistry } from '../../event';
import {
	TComponentDataTuple,
	TEntity,
	TExecuteQueryOptions,
	TQuery,
	TQueryFilter,
	TQueryRegistry
} from '../../query';
import { TAddSystemOptions, TSystemFn, TSystemRegistry } from '../../system';
import { TAnyPlugin } from '../types';
import { TMergePlugins } from './plugin';

/**
 * The core App type that represents an ECS application instance.
 */
export type TApp<GAppContext extends TAppContext = TAppContext> = GAppContext['appExtensions'] & {
	_pluginNames: string[];

	/** Component registry for managing component data */
	_componentRegistry: TComponentRegistry;
	/** Entity index for managing entity lifecycle */
	_entityIndex: TEntityIndex;
	/** Query registry for efficient entity queries */
	_queryRegistry: TQueryRegistry;
	/** System registry for managing system data */
	_systemRegistry: TSystemRegistry<GAppContext['systemSets'], TApp<GAppContext>>;
	/** Event registry for managing event data */
	_eventRegistry: TEventRegistry<GAppContext['events']>;

	c: GAppContext['components'];
	r: GAppContext['resources'];

	/**
	 * Add a plugin to the app.
	 * @param plugin - The plugin to add
	 * @returns The new app with the plugin added
	 */
	addPlugin<GNewPlugin extends TAnyPlugin>(
		plugin: GNewPlugin
	): TApp<TAppContext<[GNewPlugin, ...TPluginsFromAppContext<GAppContext>]>>;

	/**
	 * Add multiple plugins to the app.
	 * @param plugins - The plugins to add
	 * @returns The new app with the plugins added
	 */
	addPlugins<GNewPlugins extends TAnyPlugin[]>(
		plugins: GNewPlugins
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
	 * @param value - New component data (partial for SoA, boolean for marker components)
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
	 * const entities = app.queryEntities(With(Position));
	 *
	 * // Complex query with multiple conditions
	 * const movingEntities = app.queryEntities(
	 *   And(With(Position), With(Velocity), Without(Dead))
	 * );
	 * ```
	 */
	queryEntities(queryOrFilter: TQueryFilter | TQuery, options?: TExecuteQueryOptions): TEntityId[];

	/**
	 * Queries components and returns matching entities with component data.
	 *
	 * @param components Components to retrieve data from (include Entity for entity ID)
	 * @param filter Optional filter to restrict results
	 * @returns Array of component data tuples. Entities without all requested components are excluded.
	 * @example
	 * ```ts
	 * // Query for entities with both Position and Velocity, include entity ID
	 * const results = app.queryComponents([Entity, Position, Velocity]);
	 * // Returns: [[eid1, {x: 10, y: 5}, {x: 2, y: 1}], [eid2, {x: 20, y: 15}, {x: 1, y: -1}]]
	 *
	 * // Query with filter
	 * const playerResults = app.queryComponents([Entity, Health], With(Player));
	 * // Returns: [[eid1, 100], [eid3, 75]]
	 * ```
	 */
	queryComponents<T extends readonly (TComponentRef | TEntity)[]>(
		components: T,
		queryOrFilter?: TQueryFilter | TQuery
	): TComponentDataTuple<T>[];

	/**
	 * Add a system with optional ordering
	 */
	addSystem(
		fn: TSystemFn<GAppContext['systemSets'], TApp<GAppContext>>,
		options?: TAddSystemOptions<GAppContext['systemSets'], TApp<GAppContext>>
	): void;

	/**
	 * Push a new event of a specific type
	 */
	pushEvent<GType extends keyof GAppContext['events']>(
		type: GType,
		data: GAppContext['events'][GType]
	): void;

	/**
	 * Read all events of a specific type without consuming them.
	 */
	readEvent<GType extends keyof GAppContext['events']>(
		type: GType
	): TEvent<GAppContext['events'][GType]>[];

	/**
	 * Read and consume all events of a specific type.
	 */
	consumeEvent<GType extends keyof GAppContext['events']>(
		type: GType
	): TEvent<GAppContext['events'][GType]>[];

	/**
	 * Update the app.
	 */
	update(delta?: number): void;

	/**
	 * Clears the app.
	 */
	flush(): void;

	/**
	 * Resets the app to its initial state.
	 */
	reset(): void;
};

export type TAppContext<GPlugins extends TAnyPlugin[] = []> = TInnerAppContext<
	TMergePlugins<GPlugins>
>;

export type TAppWithPlugins<GPlugins extends TAnyPlugin[]> = TApp<TAppContext<GPlugins>>;

export interface TInnerAppContext<GMergedPlugins extends Record<string, any> = {}> {
	components: GMergedPlugins extends { components: infer GComponents }
		? GComponents extends Record<string, any>
			? GComponents
			: {}
		: {};
	resources: GMergedPlugins extends { resources: infer GResources }
		? GResources extends Record<string, any>
			? GResources
			: {}
		: {};
	events: GMergedPlugins extends { events: infer GEvents }
		? GEvents extends Record<string, any>
			? GEvents
			: {}
		: {};
	appExtensions: GMergedPlugins extends { appExtensions: infer GAppExtensions }
		? GAppExtensions extends Record<string, any>
			? GAppExtensions
			: {}
		: {};
	systemSets: GMergedPlugins extends { systemSets: never }
		? string
		: GMergedPlugins extends { systemSets: infer GSystemSets }
			? GSystemSets extends string
				? GSystemSets
				: string
			: string;
}

export type TPluginsFromAppContext<GAppContext extends TAppContext> =
	GAppContext extends TAppContext<infer GPlugins> ? GPlugins : never;
