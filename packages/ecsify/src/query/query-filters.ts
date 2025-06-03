import { TComponentRef } from '../component';
import { TWorld } from '../create-world';
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
					const { andMasks, orMasks, generations } = queryData;
					const entityMasks = world._componentRegistry._entityMasks;
					const addedMasks = world._componentRegistry._addedMasks;
					const changedMasks = world._componentRegistry._changedMasks;
					const removedMasks = world._componentRegistry._removedMasks;

					for (let i = 0; i < generations.length; i++) {
						const gen = generations[i] as number;
						const entityMask = entityMasks[gen]?.[eid] ?? 0;

						// Check AND requirements (must have ALL)
						const andMask = andMasks?.[gen];
						if (andMask != null) {
							if (andMask.with != null && (entityMask & andMask.with) !== andMask.with) {
								return false;
							}
							if (andMask.without != null && (entityMask & andMask.without) !== 0) {
								return false;
							}
							if (andMask.added != null) {
								const entityAddedMask = addedMasks[gen]?.[eid] ?? 0;
								if ((entityAddedMask & andMask.added) !== andMask.added) {
									return false;
								}
							}
							if (andMask.changed != null) {
								const entityChangedMask = changedMasks[gen]?.[eid] ?? 0;
								if ((entityChangedMask & andMask.changed) !== andMask.changed) {
									return false;
								}
							}
							if (andMask.removed != null) {
								const entityRemovedMask = removedMasks[gen]?.[eid] ?? 0;
								if ((entityRemovedMask & andMask.removed) !== andMask.removed) {
									return false;
								}
							}
						}

						// Check OR requirements (must have ANY within each type)
						const orMask = orMasks?.[gen];
						if (orMask != null) {
							let hasAnyOR = false;

							if (orMask.with != null && (entityMask & orMask.with) !== 0) {
								hasAnyOR = true;
							}
							if (orMask.without != null && (entityMask & orMask.without) !== orMask.without) {
								hasAnyOR = true;
							}
							if (orMask.added != null) {
								const entityAddedMask = addedMasks[gen]?.[eid] ?? 0;
								if ((entityAddedMask & orMask.added) !== 0) {
									hasAnyOR = true;
								}
							}
							if (orMask.changed != null) {
								const entityChangedMask = changedMasks[gen]?.[eid] ?? 0;
								if ((entityChangedMask & orMask.changed) !== 0) {
									hasAnyOR = true;
								}
							}
							if (orMask.removed != null) {
								const entityRemovedMask = removedMasks[gen]?.[eid] ?? 0;
								if ((entityRemovedMask & orMask.removed) !== 0) {
									hasAnyOR = true;
								}
							}

							if (!hasAnyOR) {
								return false;
							}
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
					const entityMasks = world._componentRegistry._entityMasks;
					const addedMasks = world._componentRegistry._addedMasks;
					const changedMasks = world._componentRegistry._changedMasks;
					const removedMasks = world._componentRegistry._removedMasks;

					for (let i = 0; i < generations.length; i++) {
						const gen = generations[i] as number;
						const entityMask = entityMasks[gen]?.[eid] ?? 0;
						const orMask = orMasks?.[gen];

						if (orMask != null) {
							if (orMask.with != null && (entityMask & orMask.with) !== 0) {
								return true;
							}
							if (orMask.without != null && (entityMask & orMask.without) !== orMask.without) {
								return true;
							}
							if (orMask.added != null) {
								const entityAddedMask = addedMasks[gen]?.[eid] ?? 0;
								if ((entityAddedMask & orMask.added) !== 0) {
									return true;
								}
							}
							if (orMask.changed != null) {
								const entityChangedMask = changedMasks[gen]?.[eid] ?? 0;
								if ((entityChangedMask & orMask.changed) !== 0) {
									return true;
								}
							}
							if (orMask.removed != null) {
								const entityRemovedMask = removedMasks[gen]?.[eid] ?? 0;
								if ((entityRemovedMask & orMask.removed) !== 0) {
									return true;
								}
							}
						}
					}

					return false;
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
