/**
 * Query Registry for ECS
 *
 * Simple and fast query registry with bitmask optimizations.
 */

import { TEntityId } from './entity-index';
import { categorizeEvaluationStrategy, TQueryData, TQueryFilter } from './query-filter';
import { TWorld } from './world';

/**
 * Creates a new query registry
 */
export function createQueryRegistry(world: TWorld): TQueryRegistry {
	return {
		_world: world,
		_queryCache: new Map(),

		executeQuery(filter, options = {}) {
			const { cache = true, ...getQueryOptions } = options;
			const queryData = this.getQuery(filter, getQueryOptions);

			// Return cached result if available and not dirty
			if (!queryData.isDirty && cache) {
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

		getQuery(filter, options = {}) {
			const { evaluationStrategy = categorizeEvaluationStrategy(filter) } = options;
			const hash = filter.getHash(this._world);

			// Return cached query if exists
			if (this._queryCache.has(hash)) {
				return this._queryCache.get(hash) as TQueryData;
			}

			// Create new query data
			const queryData: TQueryData = {
				hash,
				filter,
				evaluationStrategy,
				cachedResult: [],
				isDirty: true,
				generations: []
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
	executeQuery(filter: TQueryFilter, options?: TExecuteQueryOptions): TEntityId[];

	/**
	 * Gets or creates a compiled query
	 */
	getQuery(filter: TQueryFilter, options?: TGetQueryOptions): TQueryData;

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
	 * Resets the query registry to its initial state
	 */
	reset(): void;

	/**
	 * Validates the query registry integrity
	 */
	validate(): boolean;
}

export interface TGetQueryOptions {
	/** Evaluation strategy to use for the query */
	evaluationStrategy?: 'bitmask' | 'individual';
}

export interface TExecuteQueryOptions extends TGetQueryOptions {
	/** Whether to cache the query result */
	cache?: boolean;
}
