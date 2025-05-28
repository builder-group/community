/**
 * Query Registry for ECS
 *
 * Manages compiled queries with bitmask optimizations and smart cache invalidation.
 * Uses the new filter system for maximum performance.
 */

import { TComponentRef } from './component-registry';
import { TEntityId } from './entity-index';
import { TQueryData, TQueryFilter } from './query-filter';
import { TWorld } from './world';

/**
 * Creates a new query registry
 */
export function createQueryRegistry(world: TWorld): TQueryRegistry {
	return {
		_world: world,
		_queryCache: new Map(),
		_componentCallbacks: new Map(),

		executeQuery(filter) {
			const query = this.getOrCreateQuery(filter);

			// Return cached result if available and not dirty
			if (!query.isDirty && query.cachedResult) {
				return query.cachedResult;
			}

			// Calculate fresh results and cache them
			query.cachedResult = this._findMatchingEntities(query, filter);
			query.isDirty = false;

			return query.cachedResult;
		},

		getOrCreateQuery(filter) {
			const queryData: TQueryData = {
				hash: filter.getHash(world),
				cachedResult: null,
				isDirty: true,
				allComponents: filter.getComponents(),
				withMasks: {},
				withoutMasks: {}
			};

			if (filter.register) {
				filter.register(world, queryData);
			}

			if (this._queryCache.has(queryData.hash)) {
				return this._queryCache.get(queryData.hash)!;
			}

			this._queryCache.set(queryData.hash, queryData);

			// Register component callbacks for smart invalidation
			this._registerComponentCallbacks(queryData);

			return queryData;
		},

		reset() {
			// Unregister all component callbacks
			for (const [component, unregisterFn] of this._componentCallbacks) {
				unregisterFn();
			}
			this._componentCallbacks.clear();
			this._queryCache.clear();
		},

		validate() {
			return this._queryCache.size >= 0;
		},

		_findMatchingEntities(queryData, filter) {
			const matchingEntities: TEntityId[] = [];
			const aliveEntities = this._world._entityIndex.getAliveEntities();

			for (const eid of aliveEntities) {
				if (filter.evaluate(this._world, eid, queryData)) {
					matchingEntities.push(eid);
				}
			}

			return matchingEntities;
		},

		/**
		 * Registers component callbacks for smart cache invalidation
		 */
		_registerComponentCallbacks(queryData) {
			const components = queryData.allComponents;

			for (const component of components) {
				// Skip if already registered for this component
				if (this._componentCallbacks.has(component)) continue;

				// Register callback to invalidate queries when component changes
				const unregisterAdd = this._world._componentRegistry.onComponentAdd(component, () => {
					this._invalidateQueriesForComponent(component);
				});

				const unregisterRemove = this._world._componentRegistry.onComponentRemove(component, () => {
					this._invalidateQueriesForComponent(component);
				});

				// Store combined unregister function
				this._componentCallbacks.set(component, () => {
					unregisterAdd();
					unregisterRemove();
				});
			}
		},

		/**
		 * Invalidates all queries that use a specific component
		 */
		_invalidateQueriesForComponent(component) {
			for (const queryData of this._queryCache.values()) {
				const queryComponents = queryData.allComponents;
				if (queryComponents.includes(component)) {
					queryData.isDirty = true;
				}
			}
		}
	};
}

export interface TQueryRegistry {
	/** Reference to the world */
	_world: TWorld;
	/** Cache of compiled queries by hash */
	_queryCache: Map<string, TQueryData>;
	/** Map of component callbacks for smart cache invalidation */
	_componentCallbacks: Map<TComponentRef, () => void>;

	/**
	 * Executes a query and returns matching entities
	 */
	executeQuery(filter: TQueryFilter): TEntityId[];

	/**
	 * Gets or creates a compiled query
	 */
	getOrCreateQuery(filter: TQueryFilter): TQueryData;

	/**
	 * Resets the query registry to its initial state
	 */
	reset(): void;

	/**
	 * Validates the query registry integrity
	 */
	validate(): boolean;

	_findMatchingEntities(queryData: TQueryData, filter: TQueryFilter): TEntityId[];
	_registerComponentCallbacks(queryData: TQueryData): void;
	_invalidateQueriesForComponent(component: TComponentRef): void;
}
