/**
 * Query Registry for ECS
 *
 * Simple and fast query registry with bitmask optimizations.
 */

import { TComponentRef } from '../component';
import { TWorld } from '../create-world';
import { TEntityId } from '../entity';
import { categorizeEvaluationStrategy } from './categorize-evaluation-strategy';
import { Entity, TEntity, TQueryComponentValue, TQueryData, TQueryFilter } from './types';

/**
 * Creates a new query registry
 */
export function createQueryRegistry(world: TWorld): TQueryRegistry {
	return {
		_world: world,
		_queryCache: new Map(),

		queryEntities(filter, options = {}) {
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

		queryComponents<GComponents extends readonly (TComponentRef | TEntity)[]>(
			components: GComponents,
			filter?: TQueryFilter
		): TComponentDataTuple<GComponents>[] {
			// Get entities that match the filter (or all alive entities if no filter)
			const matchingEntities = filter
				? this.queryEntities(filter)
				: this._world._entityIndex.getAliveEntities();

			// For each entity, check if it has all components and get their data
			const results: TComponentDataTuple<GComponents>[] = [];
			for (const eid of matchingEntities) {
				const row: unknown[] = [];
				let hasAllComponents = true;

				for (const comp of components) {
					if (comp === Entity) {
						row.push(eid);
					} else {
						// Check if entity has this component
						if (!this._world._componentRegistry.hasComponent(eid, comp)) {
							hasAllComponents = false;
							break;
						}

						// Get component data directly from the component array/object
						let componentData;
						if (Array.isArray(comp)) {
							// Single array component: Health[eid]
							componentData = comp[eid];
						} else if (typeof comp === 'object' && comp !== null) {
							// Object with arrays (SoA): Position.x[eid], Position.y[eid]
							componentData = {} as Record<string, any>;
							let hasArrayProperties = false;
							for (const key in comp) {
								if (Array.isArray((comp as Record<string, any>)[key])) {
									componentData[key] = (comp as Record<string, any>)[key][eid];
									hasArrayProperties = true;
								}
							}

							// If no array properties found, it's a marker component
							if (!hasArrayProperties) {
								componentData = true;
							}
						} else {
							// Unsupported component
							hasAllComponents = false;
							break;
						}

						row.push(componentData);
					}
				}

				// Only include entities that have all requested components
				if (hasAllComponents) {
					results.push(row as TComponentDataTuple<GComponents>);
				}
			}

			return results;
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
		}
	};
}

export interface TQueryRegistry {
	/** Reference to the world */
	_world: TWorld;
	/** Cache of compiled queries by hash */
	_queryCache: Map<string, TQueryData>;

	/**
	 * Queries entities that match the specified filter and returns only entity IDs.
	 */
	queryEntities(filter: TQueryFilter, options?: TExecuteQueryOptions): TEntityId[];

	/**
	 * Queries components and returns matching entities with component data.
	 */
	queryComponents<GComponents extends readonly (TComponentRef | TEntity)[]>(
		components: GComponents,
		filter?: TQueryFilter
	): TComponentDataTuple<GComponents>[];

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
}

export interface TGetQueryOptions {
	/** Evaluation strategy to use for the query */
	evaluationStrategy?: 'bitmask' | 'individual';
}

export interface TExecuteQueryOptions extends TGetQueryOptions {
	/** Whether to cache the query result */
	cache?: boolean;
}

export type TComponentDataTuple<GComponents extends readonly (TComponentRef | TEntity)[]> = {
	[K in keyof GComponents]: TQueryComponentValue<GComponents[K]>;
};
