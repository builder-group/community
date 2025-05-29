import { TComponentRef } from './component-registry';
import { TEntityId } from './entity-index';
import { TWorld } from './world';

/**
 * Requires entity to have component
 */
export function With<T extends TComponentRef>(component: T): TQueryFilter {
	return {
		type: 'With',
		component,

		evaluate(world: TWorld, eid: TEntityId): boolean {
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;
			const entityMask = registry._entityMasks[generationId]?.[eid] ?? 0;
			return (entityMask & bitflag) !== 0;
		},

		register(world: TWorld, queryData: TQueryData): void {
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData != null) {
				const { generationId, bitflag } = componentData;
				queryData.withMasks[generationId] = (queryData.withMasks[generationId] ?? 0) | bitflag;

				// Add to generations array if not already present
				if (!queryData.generations.includes(generationId)) {
					queryData.generations.push(generationId);
				}
			}
		},

		getHash(world: TWorld): string {
			const componentId = getComponentId(world, component);
			return `with(${componentId})`;
		}
	};
}

/**
 * Requires entity to lack component
 */
export function Without<T extends TComponentRef>(component: T): TQueryFilter {
	return {
		type: 'Without',
		component,

		evaluate(world: TWorld, eid: TEntityId): boolean {
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData == null) {
				return true;
			}

			const { generationId, bitflag } = componentData;
			const entityMask = registry._entityMasks[generationId]?.[eid] ?? 0;
			return (entityMask & bitflag) === 0;
		},

		register(world: TWorld, queryData: TQueryData): void {
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData != null) {
				const { generationId, bitflag } = componentData;
				queryData.withoutMasks[generationId] =
					(queryData.withoutMasks[generationId] ?? 0) | bitflag;

				// Add to generations array if not already present
				if (!queryData.generations.includes(generationId)) {
					queryData.generations.push(generationId);
				}
			}
		},

		getHash(world: TWorld): string {
			const componentId = getComponentId(world, component);
			return `without(${componentId})`;
		}
	};
}

/**
 * Checks if component was added this frame
 */
export function Added<T extends TComponentRef>(component: T): TQueryFilter {
	return {
		type: 'Added',
		component,

		evaluate(world: TWorld, eid: TEntityId): boolean {
			return world._componentRegistry.wasAdded(eid, component);
		},

		register(world: TWorld, queryData: TQueryData): void {
			// Register callback to invalidate this query when components are added
			world._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});
		},

		getHash(world: TWorld): string {
			const componentId = getComponentId(world, component);
			return `added(${componentId})`;
		}
	};
}

/**
 * Checks if component was changed this frame
 */
export function Changed<T extends TComponentRef>(component: T): TQueryFilter {
	return {
		type: 'Changed',
		component,

		evaluate(world: TWorld, eid: TEntityId): boolean {
			return world._componentRegistry.wasChanged(eid, component);
		},

		register(world: TWorld, queryData: TQueryData): void {
			// Register callback to invalidate this query when components are changed
			world._componentRegistry.onComponentChange(component, () => {
				queryData.isDirty = true;
			});
		},

		getHash(world: TWorld): string {
			const componentId = getComponentId(world, component);
			return `changed(${componentId})`;
		}
	};
}

/**
 * Checks if component was removed this frame
 */
export function Removed<T extends TComponentRef>(component: T): TQueryFilter {
	return {
		type: 'Removed',
		component,

		evaluate(world: TWorld, eid: TEntityId): boolean {
			return world._componentRegistry.wasRemoved(eid, component);
		},

		register(world: TWorld, queryData: TQueryData): void {
			// Register callback to invalidate this query when components are removed
			world._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});
		},

		getHash(world: TWorld): string {
			const componentId = getComponentId(world, component);
			return `removed(${componentId})`;
		}
	};
}

/**
 * Requires all child filters to match (uses fast bitmask checking when possible)
 */
export function And(...filters: TQueryFilter[]): TQueryFilter {
	return {
		type: 'And',
		filters,

		evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean {
			// Fast path: Use pre-computed bitmasks for compatible queries
			if (queryData.evaluationStrategy === 'bitmask') {
				const registry = world._componentRegistry;
				const { withMasks, withoutMasks, notMasks, orMasks, generations } = queryData;

				for (let i = 0; i < generations.length; i++) {
					const generationId = generations[i] as number;
					const entityMask = registry._entityMasks[generationId]?.[eid] ?? 0;

					// Required components: entity must have ALL
					const withMask = withMasks[generationId];
					if (withMask != null && (entityMask & withMask) !== withMask) {
						return false;
					}

					// Forbidden components (Without): entity must have NONE
					const withoutMask = withoutMasks[generationId];
					if (withoutMask != null && (entityMask & withoutMask) !== 0) {
						return false;
					}

					// Forbidden components (Not): entity must have NONE
					const notMask = notMasks[generationId];
					if (notMask != null && (entityMask & notMask) !== 0) {
						return false;
					}

					// OR components: entity must have AT LEAST ONE
					const orMask = orMasks[generationId];
					if (orMask != null && (entityMask & orMask) === 0) {
						return false;
					}
				}

				return true;
			}

			// Fallback: Evaluate filters individually
			return filters.every((filter) => filter.evaluate(world, eid, queryData));
		},

		register(world: TWorld, queryData: TQueryData): void {
			// Let child filters register their bitmasks
			for (const filter of filters) {
				if (filter.register != null) {
					filter.register(world, queryData);
				}
			}
		},

		getHash(world: TWorld): string {
			const childHashes = filters
				.map((f) => f.getHash(world))
				.sort()
				.join(',');
			return `and(${childHashes})`;
		}
	};
}

/**
 * Requires any child filter to match
 */
export function Or(...filters: TQueryFilter[]): TQueryFilter {
	return {
		type: 'Or',
		filters,

		evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean {
			return filters.some((filter) => filter.evaluate(world, eid, queryData));
		},

		register(world: TWorld, queryData: TQueryData): void {
			// If parent uses bitmask evaluation, populate orMasks from With children
			if (queryData.evaluationStrategy === 'bitmask') {
				for (const filter of filters) {
					if (filter.type === 'With') {
						const registry = world._componentRegistry;
						const componentData = registry._componentMap.get(filter.component);
						if (componentData != null) {
							const { generationId, bitflag } = componentData;
							queryData.orMasks[generationId] = (queryData.orMasks[generationId] ?? 0) | bitflag;
						}
					}
				}
			} else {
				// For individual evaluation, register child filters normally
				for (const filter of filters) {
					if (filter.register != null) {
						filter.register(world, queryData);
					}
				}
			}
		},

		getHash(world: TWorld): string {
			const childHashes = filters
				.map((f) => f.getHash(world))
				.sort()
				.join(',');
			return `or(${childHashes})`;
		}
	};
}

/**
 * Requires no child filter to match
 */
export function Not(...filters: TQueryFilter[]): TQueryFilter {
	return {
		type: 'Not',
		filters,

		evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean {
			return !filters.some((filter) => filter.evaluate(world, eid, queryData));
		},

		register(world: TWorld, queryData: TQueryData): void {
			// If parent uses bitmask evaluation, populate notMasks from With children
			if (queryData.evaluationStrategy === 'bitmask') {
				for (const filter of filters) {
					if (filter.type === 'With') {
						const registry = world._componentRegistry;
						const componentData = registry._componentMap.get(filter.component);
						if (componentData != null) {
							const { generationId, bitflag } = componentData;
							queryData.notMasks[generationId] = (queryData.notMasks[generationId] ?? 0) | bitflag;
						}
					}
				}
			} else {
				// For individual evaluation, register child filters normally
				for (const filter of filters) {
					if (filter.register != null) {
						filter.register(world, queryData);
					}
				}
			}
		},

		getHash(world: TWorld): string {
			const childHashes = filters
				.map((f) => f.getHash(world))
				.sort()
				.join(',');
			return `not(${childHashes})`;
		}
	};
}

/**
 * Special filter that matches no entities
 */
export function None(): TQueryFilter {
	return {
		type: 'None',

		evaluate(): boolean {
			return false;
		},

		getHash(): string {
			return 'none()';
		}
	};
}

// Aliases for convenience
export const All = And;
export const Any = Or;

export interface TQueryData {
	/** Unique hash identifying this query filter combination */
	hash: string;

	/** The original query filter that was compiled into this data */
	filter: TQueryFilter;

	/** Cached array of entity IDs that match this query */
	cachedResult: TEntityId[];

	/** True when cached results are stale and need re-evaluation */
	isDirty: boolean;

	/**
	 * True if this query contains Added/Changed/Removed filters and needs
	 * cache invalidation when world.flush() clears change tracking masks.
	 * Pre-computed during registration for O(1) flush performance.
	 */
	needsFlushInvalidation: boolean;

	/**
	 * Pre-computed evaluation strategy for optimal performance:
	 * - 'bitmask': Fast bitwise operations for With/Without combinations
	 * - 'individual': Filter-by-filter evaluation for complex queries
	 */
	evaluationStrategy: 'bitmask' | 'individual';

	/** Pre-computed generations array for optimal bitmask lookup */
	generations: number[];

	/** Bitmasks for required components (With filters) by generation ID */
	withMasks: Record<number, number>;

	/** Bitmasks for forbidden components (Without filters) by generation ID */
	withoutMasks: Record<number, number>;

	/** Bitmasks for OR components by generation ID */
	orMasks: Record<number, number>;

	/** Bitmasks for NOT components by generation ID */
	notMasks: Record<number, number>;
}

export interface TBaseQueryFilter {
	type: string;
	evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean;
	register?(world: TWorld, queryData: TQueryData): void;
	getHash(world: TWorld): string;
}

export type TQueryFilter =
	| (TBaseQueryFilter & { type: 'With'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'Without'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'Added'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'Changed'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'Removed'; component: TComponentRef })
	| (TBaseQueryFilter & { type: 'And'; filters: TQueryFilter[] })
	| (TBaseQueryFilter & { type: 'Or'; filters: TQueryFilter[] })
	| (TBaseQueryFilter & { type: 'Not'; filters: TQueryFilter[] })
	| (TBaseQueryFilter & { type: 'None' });

/**
 * Helper to get component ID, registering if needed
 */
function getComponentId(world: TWorld, component: TComponentRef): number {
	const registry = world._componentRegistry;
	if (!registry._componentMap.has(component)) {
		registry.registerComponent(component);
	}
	return registry._componentMap.get(component)!.id;
}

/**
 * Pre-categorizes a query's evaluation strategy for optimal performance.
 *
 * Strategies:
 * - 'bitmask': All filters can use bitwise operations (With/Without/Or(With...)/Not(With...))
 * - 'individual': Contains change detection or complex nested filters requiring individual evaluation
 */
export function categorizeEvaluationStrategy(filter: TQueryFilter): 'bitmask' | 'individual' {
	// Simple bitmask-compatible filters
	if (filter.type === 'With' || filter.type === 'Without') {
		return 'bitmask';
	}

	// Or is bitmask-compatible if all children are With filters
	if (filter.type === 'Or') {
		return filter.filters.every((f) => f.type === 'With') ? 'bitmask' : 'individual';
	}

	// Not is bitmask-compatible if all children are With filters
	if (filter.type === 'Not') {
		return filter.filters.every((f) => f.type === 'With') ? 'bitmask' : 'individual';
	}

	// And is bitmask-compatible if ALL children are bitmask-compatible
	if (filter.type === 'And') {
		return filter.filters.every((f) => categorizeEvaluationStrategy(f) === 'bitmask')
			? 'bitmask'
			: 'individual';
	}

	// Change detection filters require individual evaluation
	return 'individual';
}

/**
 * Checks if a filter contains change detection filters (Added/Changed/Removed).
 * Used to pre-compute needsFlushInvalidation flag for O(1) flush performance.
 */
export function hasChangeDetectionFilter(filter: TQueryFilter): boolean {
	// Direct change detection filters
	if (filter.type === 'Added' || filter.type === 'Changed' || filter.type === 'Removed') {
		return true;
	}

	// Check composite filters recursively
	if ('filters' in filter && Array.isArray(filter.filters)) {
		return filter.filters.some((f) => hasChangeDetectionFilter(f));
	}

	return false;
}
