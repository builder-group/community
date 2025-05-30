import { TComponentRef } from '../component';
import { TEntityId } from '../entity';
import { TWorld } from '../world';
import { TQueryData, TQueryFilter, TQueryParentType } from './types';

/**
 * Requires entity to have component
 */
export function With<T extends TComponentRef>(component: T): TQueryFilter {
	return {
		type: 'With',
		component,

		evaluate(world, eid): boolean {
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;
			const entityMask = registry._entityMasks[generationId]?.[eid] ?? 0;
			return (entityMask & bitflag) !== 0;
		},

		register(world, queryData, parentType): void {
			// Register callbacks to invalidate this query when components are added/removed
			world._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});
			world._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(world, queryData, component, 'with', parentType);
		},

		getHash(world): string {
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

		evaluate(world, eid): boolean {
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData == null) {
				return true;
			}

			const { generationId, bitflag } = componentData;
			const entityMask = registry._entityMasks[generationId]?.[eid] ?? 0;
			return (entityMask & bitflag) === 0;
		},

		register(world, queryData, parentType): void {
			// Register callbacks to invalidate this query when components are added/removed
			world._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});
			world._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(world, queryData, component, 'without', parentType);
		},

		getHash(world): string {
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

		evaluate(world, eid): boolean {
			return world._componentRegistry.wasAdded(eid, component);
		},

		register(world, queryData, parentType): void {
			// Register callback to invalidate this query when components are added
			world._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});

			// Register callback to invalidate when change tracking is flushed
			world._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(world, queryData, component, 'added', parentType);
		},

		getHash(world): string {
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

		evaluate(world, eid): boolean {
			return world._componentRegistry.wasChanged(eid, component);
		},

		register(world, queryData, parentType): void {
			// Register callback to invalidate this query when components are changed
			world._componentRegistry.onComponentChange(component, () => {
				queryData.isDirty = true;
			});

			// Register callback to invalidate when change tracking is flushed
			world._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(world, queryData, component, 'changed', parentType);
		},

		getHash(world): string {
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

		evaluate(world, eid): boolean {
			return world._componentRegistry.wasRemoved(eid, component);
		},

		register(world, queryData, parentType): void {
			// Register callback to invalidate this query when components are removed
			world._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});

			// Register callback to invalidate when change tracking is flushed
			world._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(world, queryData, component, 'removed', parentType);
		},

		getHash(world): string {
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

		evaluate(world, eid, queryData): boolean {
			switch (queryData.evaluationStrategy) {
				case 'bitmask': {
					const { orMasks, andMasks, generations } = queryData;

					// Check AND requirements
					if (andMasks != null) {
						if (!evaluateAndMasks(world, eid, andMasks, generations)) {
							return false;
						}
					}

					// Check OR requirements
					if (orMasks != null) {
						if (!evaluateOrMasks(world, eid, orMasks, generations)) {
							return false;
						}
					}

					return true;
				}

				case 'individual':
					return filters.every((filter) => filter.evaluate(world, eid, queryData));
			}
		},

		register(world, queryData): void {
			for (const filter of filters) {
				if (filter.register != null) {
					filter.register(world, queryData, 'And');
				}
			}
		},

		getHash(world): string {
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

		evaluate(world, eid, queryData): boolean {
			switch (queryData.evaluationStrategy) {
				case 'bitmask': {
					const { orMasks, generations } = queryData;
					return orMasks != null ? evaluateOrMasks(world, eid, orMasks, generations) : false;
				}

				case 'individual':
					return filters.some((filter) => filter.evaluate(world, eid, queryData));
			}
		},

		register(world, queryData): void {
			for (const filter of filters) {
				if (filter.register != null) {
					filter.register(world, queryData, 'Or');
				}
			}
		},

		getHash(world): string {
			const childHashes = filters
				.map((f) => f.getHash(world))
				.sort()
				.join(',');
			return `or(${childHashes})`;
		}
	};
}

// Aliases for convenience
export const All = And;
export const Any = Or;

/**
 * Helper to get component ID, registering if needed
 */
function getComponentId(world: TWorld, component: TComponentRef): number {
	const registry = world._componentRegistry;
	if (!registry._componentMap.has(component)) {
		registry.registerComponent(component);
	}
	return registry._componentMap.get(component)?.id as number;
}

/**
 * Helper function to evaluate AND bitmask logic
 */
function evaluateAndMasks(
	world: TWorld,
	eid: TEntityId,
	andMasks: Record<
		number,
		{ with?: number; without?: number; added?: number; changed?: number; removed?: number }
	>,
	generations: number[]
): boolean {
	const entityMasks = world._componentRegistry._entityMasks;
	const registryAddedMasks = world._componentRegistry._addedMasks;
	const registryChangedMasks = world._componentRegistry._changedMasks;
	const registryRemovedMasks = world._componentRegistry._removedMasks;

	for (let i = 0; i < generations.length; i++) {
		const generationId = generations[i] as number;
		const entityMask = entityMasks[generationId]?.[eid] ?? 0;
		const andMask = andMasks[generationId];

		if (andMask == null) {
			continue;
		}

		// WITH check: entity must have ALL required components
		if (andMask.with != null && (entityMask & andMask.with) !== andMask.with) {
			return false;
		}

		// WITHOUT check: entity must have NONE of the forbidden components
		if (andMask.without != null && (entityMask & andMask.without) !== 0) {
			return false;
		}

		// ADDED check: entity must have ALL added components
		if (andMask.added != null) {
			const entityAddedMask = registryAddedMasks[generationId]?.[eid] ?? 0;
			if ((entityAddedMask & andMask.added) !== andMask.added) {
				return false;
			}
		}

		// CHANGED check: entity must have ALL changed components
		if (andMask.changed != null) {
			const entityChangedMask = registryChangedMasks[generationId]?.[eid] ?? 0;
			if ((entityChangedMask & andMask.changed) !== andMask.changed) {
				return false;
			}
		}

		// REMOVED check: entity must have ALL removed components
		if (andMask.removed != null) {
			const entityRemovedMask = registryRemovedMasks[generationId]?.[eid] ?? 0;
			if ((entityRemovedMask & andMask.removed) !== andMask.removed) {
				return false;
			}
		}
	}

	return true;
}

/**
 * Helper function to evaluate OR bitmask logic
 */
function evaluateOrMasks(
	world: TWorld,
	eid: TEntityId,
	orMasks: Record<
		number,
		{ with?: number; without?: number; added?: number; changed?: number; removed?: number }
	>,
	generations: number[]
): boolean {
	const entityMasks = world._componentRegistry._entityMasks;
	const registryAddedMasks = world._componentRegistry._addedMasks;
	const registryChangedMasks = world._componentRegistry._changedMasks;
	const registryRemovedMasks = world._componentRegistry._removedMasks;

	for (let i = 0; i < generations.length; i++) {
		const generationId = generations[i] as number;
		const entityMask = entityMasks[generationId]?.[eid] ?? 0;
		const orMask = orMasks[generationId];

		if (orMask == null) {
			continue;
		}

		// OR WITH: entity has AT LEAST ONE of the OR components
		if (orMask.with != null && (entityMask & orMask.with) !== 0) {
			return true;
		}

		// OR WITHOUT: entity lacks AT LEAST ONE of the OR-forbidden components
		if (orMask.without != null && (entityMask & orMask.without) !== orMask.without) {
			return true;
		}

		// OR ADDED: entity has AT LEAST ONE OR-added component
		if (orMask.added != null) {
			const entityAddedMask = registryAddedMasks[generationId]?.[eid] ?? 0;
			if ((entityAddedMask & orMask.added) !== 0) {
				return true;
			}
		}

		// OR CHANGED: entity has AT LEAST ONE OR-changed component
		if (orMask.changed != null) {
			const entityChangedMask = registryChangedMasks[generationId]?.[eid] ?? 0;
			if ((entityChangedMask & orMask.changed) !== 0) {
				return true;
			}
		}

		// OR REMOVED: entity has AT LEAST ONE OR-removed component
		if (orMask.removed != null) {
			const entityRemovedMask = registryRemovedMasks[generationId]?.[eid] ?? 0;
			if ((entityRemovedMask & orMask.removed) !== 0) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Helper function to register component masks with proper parent type
 */
function registerComponentMask(
	world: TWorld,
	queryData: TQueryData,
	component: TComponentRef,
	maskType: 'with' | 'without' | 'added' | 'changed' | 'removed',
	parentType: TQueryParentType = 'And'
): void {
	const registry = world._componentRegistry;
	const componentData = registry._componentMap.get(component);
	if (componentData == null) {
		return;
	}

	const { generationId, bitflag } = componentData;

	// Determine which mask structure to use based on parent type
	let targetMasks: 'andMasks' | 'orMasks';
	switch (parentType) {
		case 'And':
			targetMasks = 'andMasks';
			break;
		case 'Or':
			targetMasks = 'orMasks';
			break;
	}

	// Lazy allocation: only create objects when needed
	if (queryData[targetMasks] == null) {
		queryData[targetMasks] = {};
	}
	if (queryData[targetMasks]![generationId] == null) {
		queryData[targetMasks]![generationId] = {};
	}
	if (queryData.affectedMasks == null) {
		queryData.affectedMasks = {};
	}

	// Add to appropriate mask
	queryData[targetMasks]![generationId]![maskType] =
		(queryData[targetMasks]![generationId]![maskType] ?? 0) | bitflag;
	queryData.affectedMasks[generationId] = (queryData.affectedMasks[generationId] ?? 0) | bitflag;

	// Add to generations array if not already present
	if (!queryData.generations.includes(generationId)) {
		queryData.generations.push(generationId);
	}
}
