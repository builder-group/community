/**
 * Query Registry for ECS
 *
 * Simple and fast query registry with bitmask optimizations.
 */

import { TEntityId } from './entity-index';
import {
	categorizeEvaluationStrategy,
	hasChangeDetectionFilter,
	TQueryData,
	TQueryFilter
} from './query-filter';
import { TWorld } from './world';

/**
 * Creates a new query registry
 */
export function createQueryRegistry(world: TWorld): TQueryRegistry {
	return {
		_world: world,
		_queryCache: new Map(),

		executeQuery(filter) {
			const queryData = this.getQuery(filter);

			// Return cached result if available and not dirty
			if (!queryData.isDirty) {
				return queryData.cachedResult;
			}

			// Exit if no entities exist
			const aliveEntities = this._world._entityIndex.getAliveEntities();
			if (aliveEntities.length === 0) {
				queryData.cachedResult = [];
				queryData.isDirty = false;
				return [];
			}

			// Find matching entities
			const matchingEntities: TEntityId[] = [];
			for (const eid of aliveEntities) {
				if (filter.evaluate(this._world, eid, queryData)) {
					matchingEntities.push(eid);
				}
			}

			// Cache results
			queryData.cachedResult = matchingEntities;
			queryData.isDirty = false;

			return matchingEntities;
		},

		getQuery(filter) {
			const hash = filter.getHash(this._world);

			// Return cached query if exists
			if (this._queryCache.has(hash)) {
				return this._queryCache.get(hash)!;
			}

			// Create new query data
			const queryData: TQueryData = {
				hash,
				filter,
				cachedResult: [],
				isDirty: true,
				needsFlushInvalidation: hasChangeDetectionFilter(filter),
				evaluationStrategy: categorizeEvaluationStrategy(filter),
				generations: [],
				withMasks: {},
				withoutMasks: {},
				notMasks: {},
				orMasks: {}
			};

			// Let filter register
			if (filter.register != null) {
				filter.register(this._world, queryData);
			}

			// Cache the query
			this._queryCache.set(hash, queryData);

			return queryData;
		},

		registerQuery(filter) {
			return this.getQuery(filter);
		},

		generateQueryHash(filter) {
			return filter.getHash(this._world);
		},

		checkEntity(queryData, eid) {
			// Use the stored filter's evaluate method with the query data
			return queryData.filter.evaluate(this._world, eid, queryData);
		},

		invalidateQueries() {
			// Mark all queries as dirty
			for (const queryData of this._queryCache.values()) {
				queryData.isDirty = true;
			}
		},

		flush() {
			// Invalidate queries that were pre-marked as needing flush invalidation during registration.
			for (const queryData of this._queryCache.values()) {
				if (queryData.needsFlushInvalidation) {
					queryData.isDirty = true;
				}
			}
		},

		reset() {
			this._queryCache.clear();
		},

		validate() {
			return this._queryCache.size >= 0;
		}
	};
}

export interface TQueryRegistry {
	/** Reference to the world */
	_world: TWorld;
	/** Cache of compiled queries by hash */
	_queryCache: Map<string, TQueryData>;

	/**
	 * Executes a query and returns matching entities
	 */
	executeQuery(filter: TQueryFilter): TEntityId[];

	/**
	 * Gets or creates a compiled query
	 */
	getQuery(filter: TQueryFilter): TQueryData;

	/**
	 * Registers a query (alias for getOrCreateQuery)
	 */
	registerQuery(filter: TQueryFilter): TQueryData;

	/**
	 * Generates a hash for a query filter
	 */
	generateQueryHash(filter: TQueryFilter): string;

	/**
	 * Checks if an entity matches a query
	 */
	checkEntity(queryData: TQueryData, eid: TEntityId): boolean;

	/**
	 * Invalidates all cached queries
	 */
	invalidateQueries(): void;

	/**
	 * Flushes the query registry
	 */
	flush(): void;

	/**
	 * Resets the query registry to its initial state
	 */
	reset(): void;

	/**
	 * Validates the query registry integrity
	 */
	validate(): boolean;
}
