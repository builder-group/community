import { TComponentRef, TComponentRegistry } from '../component';
import { TEntityId, TEntityIndex } from '../entity';
import { categorizeEvaluationStrategy } from './categorize-evaluation-strategy';
import { And, With } from './query-filters';
import { Entity, TEntity, TQueryComponentValue, TQueryData, TQueryFilter } from './types';

/**
 * Creates a new query registry
 */
export function createQueryRegistry(
	entityIndex: TEntityIndex,
	componentRegistry: TComponentRegistry
): TQueryRegistry {
	return {
		_entityIndex: entityIndex,
		_componentRegistry: componentRegistry,
		_queryCache: new Map(),

		queryEntities(filter, options = {}) {
			const { cache = true, ...getQueryOptions } = options;
			const queryData = this.getQuery(filter, getQueryOptions);

			// Return cached result if available and not dirty
			if (!queryData.isDirty && cache) {
				return queryData.cachedResult;
			}

			// Exit if no entities exist
			if (this._entityIndex._aliveCount <= 0) {
				queryData.cachedResult = [];
				queryData.isDirty = false;
				return [];
			}

			// Find matching entities
			// Dense iteration with O(1) bitmask checks - simple and cache-friendly
			// If this becomes slow: consider archetype system (group entities by component signature)?
			// https://www.youtube.com/watch?v=71RSWVyOMEY
			const matchingEntities: TEntityId[] = [];
			for (let i = 0; i < this._entityIndex._aliveCount; i++) {
				const eid = this._entityIndex._dense[i];
				if (eid != null && filter.evaluate(this, eid, queryData)) {
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
			// Query entities matching the provided filter,
			// or infer a filter from the given components if none is provided
			const matchingEntities = filter
				? this.queryEntities(filter)
				: this.queryEntities(
						And(
							...components.reduce((acc, val) => {
								if (val !== Entity) {
									acc.push(With(val));
								}
								return acc;
							}, [] as TQueryFilter[])
						)
					);

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
						if (!this._componentRegistry.hasComponent(eid, comp)) {
							hasAllComponents = false;
							break;
						}

						// Get component data directly from the component array/object
						let componentData;
						if (Array.isArray(comp)) {
							// Array of objects (AoS) or single value array component: Health[eid]
							componentData = comp[eid];
						} else if (typeof comp === 'object' && comp !== null) {
							// Object with array properties component (SoA): Position.x[eid]
							componentData = {} as Record<string, any>;
							let hasArrayProperties = false;
							for (const key in comp) {
								if (Array.isArray(comp[key])) {
									componentData[key] = comp[key][eid];
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
			const hash = filter.getHash(this);

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
				filter.register(this, queryData);
			}

			// Cache the query
			this._queryCache.set(hash, queryData);

			return queryData;
		},

		registerQuery(filter) {
			return this.getQuery(filter);
		},

		generateQueryHash(filter) {
			return filter.getHash(this);
		},

		checkEntity(queryData, eid) {
			// Use the stored filter's evaluate method with the query data
			return queryData.filter.evaluate(this, eid, queryData);
		},

		reset() {
			this._queryCache.clear();
		}
	};
}

export interface TQueryRegistry {
	/** Reference to the entity index */
	_entityIndex: TEntityIndex;
	/** Reference to the component registry */
	_componentRegistry: TComponentRegistry;
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
