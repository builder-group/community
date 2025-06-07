import { TComponentRef, TComponentRegistry } from '../component';
import { TEntityId, TEntityIndex } from '../entity';
import { createQuery, isQuery, TQuery } from './queries';
import { And, TQueryFilter, With } from './query-filters';
import { Entity, TEntity, TQueryComponentValue } from './types';

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

		queryEntities(filterOrQuery, options = {}) {
			const { cache = true, ...getQueryOptions } = options;
			const query = isQuery(filterOrQuery)
				? filterOrQuery
				: this.getQuery(filterOrQuery, getQueryOptions);

			// Return cached result if available and not dirty
			if (!query.isDirty && cache) {
				return query.cachedResult;
			}

			// Exit if no entities exist
			if (this._entityIndex._aliveCount <= 0) {
				query.cachedResult = [];
				query.isDirty = false;
				return [];
			}

			// Find matching entities
			const matchingEntities = query.query(this);

			// Cache results
			query.cachedResult = matchingEntities;
			query.isDirty = false;

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
			const hash = filter.getHash(this);

			// Return cached query if exists
			if (this._queryCache.has(hash)) {
				return this._queryCache.get(hash) as TQuery;
			}

			return this.registerQuery(filter, options);
		},

		registerQuery(queryOrFilter, options = {}) {
			const { evaluationStrategy } = options;

			// Create new query data
			const query = isQuery(queryOrFilter)
				? queryOrFilter
				: createQuery(this, queryOrFilter, {
						evaluationStrategy
					});

			// Let query register itself
			query.register(this);

			// Cache the query
			this._queryCache.set(query.hash, query);

			return query;
		},

		checkEntity(query, eid) {
			return query.evaluate(this, eid);
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
	_queryCache: Map<string, TQuery>;

	/**
	 * Queries entities that match the specified filter and returns only entity IDs.
	 */
	queryEntities(queryOrFilter: TQueryFilter | TQuery, options?: TExecuteQueryOptions): TEntityId[];

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
	getQuery(filter: TQueryFilter, options?: TRegisterQueryOptions): TQuery;

	/**
	 * Registers a query.
	 */
	registerQuery(queryOrFilter: TQueryFilter | TQuery, options?: TRegisterQueryOptions): TQuery;

	/**
	 * Checks if an entity matches a query
	 */
	checkEntity(query: TQuery, eid: TEntityId): boolean;

	/**
	 * Resets the query registry to its initial state
	 */
	reset(): void;
}

export interface TRegisterQueryOptions {
	/** Evaluation strategy to use for the query */
	evaluationStrategy?: 'bitmask' | 'individual';
}

export interface TExecuteQueryOptions extends TRegisterQueryOptions {
	/** Whether to cache the query result */
	cache?: boolean;
}

export type TComponentDataTuple<GComponents extends readonly (TComponentRef | TEntity)[]> = {
	[K in keyof GComponents]: TQueryComponentValue<GComponents[K]>;
};
