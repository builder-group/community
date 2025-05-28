import { TComponentRef } from './component-registry';
import { TEntityId } from './entity-index';
import { TWorld } from './world';

/**
 * Checks if entity has component using bitmask
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

		getComponents(): TComponentRef[] {
			return [component];
		},

		register(world: TWorld, queryData: TQueryData): void {
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData != null) {
				const { generationId, bitflag } = componentData;
				queryData.withMasks[generationId] = (queryData.withMasks[generationId] ?? 0) | bitflag;
			}
		},

		getHash(world: TWorld): string {
			const componentId = getComponentId(world, component);
			return `with(${componentId})`;
		}
	};
}

/**
 * Checks if entity lacks component using bitmask
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

		getComponents(): TComponentRef[] {
			return [component];
		},

		register(world: TWorld, queryData: TQueryData): void {
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData != null) {
				const { generationId, bitflag } = componentData;
				queryData.withoutMasks[generationId] =
					(queryData.withoutMasks[generationId] ?? 0) | bitflag;
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

		getComponents(): TComponentRef[] {
			return [component];
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

		getComponents(): TComponentRef[] {
			return [component];
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

		getComponents(): TComponentRef[] {
			return [component];
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
 * All filters must match (uses batched bitmask checking when possible)
 */
export function And(...filters: TQueryFilter[]): TQueryFilter {
	return {
		type: 'And',
		filters,

		evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean {
			// Use batched bitmask checking if all filters are With/Without
			const allSimple = filters.every((f) => f.type === 'With' || f.type === 'Without');

			if (
				allSimple &&
				(Object.keys(queryData.withMasks).length > 0 ||
					Object.keys(queryData.withoutMasks).length > 0)
			) {
				const registry = world._componentRegistry;

				// Check all required components in batches
				for (const [generationId, withMask] of Object.entries(queryData.withMasks)) {
					const entityMask = registry._entityMasks[+generationId]?.[eid] ?? 0;
					if ((entityMask & withMask) !== withMask) {
						return false;
					}
				}

				// Check all forbidden components in batches
				for (const [generationId, withoutMask] of Object.entries(queryData.withoutMasks)) {
					const entityMask = registry._entityMasks[+generationId]?.[eid] ?? 0;
					if ((entityMask & withoutMask) !== 0) {
						return false;
					}
				}

				return true;
			}

			// Fallback to individual filter evaluation
			return filters.every((filter) => filter.evaluate(world, eid, queryData));
		},

		getComponents(): TComponentRef[] {
			return filters.flatMap((filter) => filter.getComponents());
		},

		register(world: TWorld, queryData: TQueryData): void {
			// Let child filters register their bitmasks
			for (const filter of filters) {
				if (filter.register) {
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
 * Any filter must match (requires individual evaluation)
 */
export function Or(...filters: TQueryFilter[]): TQueryFilter {
	return {
		type: 'Or',
		filters,

		evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean {
			return filters.some((filter) => filter.evaluate(world, eid, queryData));
		},

		getComponents(): TComponentRef[] {
			return filters.flatMap((filter) => filter.getComponents());
		},

		register(world: TWorld, queryData: TQueryData): void {
			for (const filter of filters) {
				if (filter.register) {
					filter.register(world, queryData);
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
 * No filter must match (requires individual evaluation)
 */
export function Not(...filters: TQueryFilter[]): TQueryFilter {
	return {
		type: 'Not',
		filters,

		evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean {
			return !filters.some((filter) => filter.evaluate(world, eid, queryData));
		},

		getComponents(): TComponentRef[] {
			return filters.flatMap((filter) => filter.getComponents());
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

		getComponents(): TComponentRef[] {
			return [];
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
	hash: string;
	filter: TQueryFilter;
	cachedResult: TEntityId[] | null;
	isDirty: boolean;
	allComponents: TComponentRef[];
	withMasks: Record<number, number>;
	withoutMasks: Record<number, number>;
}

export interface TBaseQueryFilter {
	type: string;
	evaluate(world: TWorld, eid: TEntityId, queryData: TQueryData): boolean;
	getComponents(): TComponentRef[];
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
