import { TComponentRef } from '../component';
import { TQueryRegistry } from './create-query-registry';
import { TQueryData, TQueryFilter, TQueryParentType } from './types';

/**
 * Requires entity to have component
 */
export function With<T extends TComponentRef>(component: T): TQueryFilter {
	return {
		type: 'With',
		component,

		evaluate(queryRegistry, eid): boolean {
			const registry = queryRegistry._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;
			const entityMask = registry._entityMasks[generationId]?.[eid] ?? 0;
			return (entityMask & bitflag) !== 0;
		},

		register(queryRegistry, queryData, parentType): void {
			// Register callbacks to invalidate this query when components are added/removed
			queryRegistry._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});
			queryRegistry._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(queryRegistry, queryData, component, 'with', parentType);
		},

		getHash(queryRegistry): string {
			const componentId = getComponentId(queryRegistry, component);
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

		evaluate(queryRegistry, eid): boolean {
			const registry = queryRegistry._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData == null) {
				return true;
			}

			const { generationId, bitflag } = componentData;
			const entityMask = registry._entityMasks[generationId]?.[eid] ?? 0;
			return (entityMask & bitflag) === 0;
		},

		register(queryRegistry, queryData, parentType): void {
			// Register callbacks to invalidate this query when components are added/removed
			queryRegistry._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});
			queryRegistry._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(queryRegistry, queryData, component, 'without', parentType);
		},

		getHash(queryRegistry): string {
			const componentId = getComponentId(queryRegistry, component);
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

		evaluate(queryRegistry, eid): boolean {
			return queryRegistry._componentRegistry.wasAdded(eid, component);
		},

		register(queryRegistry, queryData, parentType): void {
			// Register callback to invalidate this query when components are added
			queryRegistry._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});

			// Register callback to invalidate when change tracking is flushed
			queryRegistry._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(queryRegistry, queryData, component, 'added', parentType);
		},

		getHash(queryRegistry): string {
			const componentId = getComponentId(queryRegistry, component);
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

		evaluate(queryRegistry, eid): boolean {
			return queryRegistry._componentRegistry.wasChanged(eid, component);
		},

		register(queryRegistry, queryData, parentType): void {
			// Register callback to invalidate this query when components are changed
			queryRegistry._componentRegistry.onComponentChange(component, () => {
				queryData.isDirty = true;
			});

			// Register callback to invalidate when change tracking is flushed
			queryRegistry._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(queryRegistry, queryData, component, 'changed', parentType);
		},

		getHash(queryRegistry): string {
			const componentId = getComponentId(queryRegistry, component);
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

		evaluate(queryRegistry, eid): boolean {
			return queryRegistry._componentRegistry.wasRemoved(eid, component);
		},

		register(queryRegistry, queryData, parentType): void {
			// Register callback to invalidate this query when components are removed
			queryRegistry._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});

			// Register callback to invalidate when change tracking is flushed
			queryRegistry._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register the component mask in the appropriate structure
			registerComponentMask(queryRegistry, queryData, component, 'removed', parentType);
		},

		getHash(queryRegistry): string {
			const componentId = getComponentId(queryRegistry, component);
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

		evaluate(queryRegistry, eid, queryData): boolean {
			switch (queryData.evaluationStrategy) {
				case 'bitmask': {
					const { andMasks, orMasks, generations } = queryData;
					const entityMasks = queryRegistry._componentRegistry._entityMasks;
					const addedMasks = queryRegistry._componentRegistry._addedMasks;
					const changedMasks = queryRegistry._componentRegistry._changedMasks;
					const removedMasks = queryRegistry._componentRegistry._removedMasks;

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
					return filters.every((filter) => filter.evaluate(queryRegistry, eid, queryData));
			}
		},

		register(queryRegistry, queryData): void {
			for (const filter of filters) {
				if (filter.register != null) {
					filter.register(queryRegistry, queryData, 'And');
				}
			}
		},

		getHash(queryRegistry): string {
			const childHashes = filters
				.map((f) => f.getHash(queryRegistry))
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

		evaluate(queryRegistry, eid, queryData): boolean {
			switch (queryData.evaluationStrategy) {
				case 'bitmask': {
					const { orMasks, generations } = queryData;
					const entityMasks = queryRegistry._componentRegistry._entityMasks;
					const addedMasks = queryRegistry._componentRegistry._addedMasks;
					const changedMasks = queryRegistry._componentRegistry._changedMasks;
					const removedMasks = queryRegistry._componentRegistry._removedMasks;

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
					return filters.some((filter) => filter.evaluate(queryRegistry, eid, queryData));
			}
		},

		register(queryRegistry, queryData): void {
			for (const filter of filters) {
				if (filter.register != null) {
					filter.register(queryRegistry, queryData, 'Or');
				}
			}
		},

		getHash(queryRegistry): string {
			const childHashes = filters
				.map((f) => f.getHash(queryRegistry))
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
function getComponentId(queryRegistry: TQueryRegistry, component: TComponentRef): number {
	const registry = queryRegistry._componentRegistry;
	if (!registry._componentMap.has(component)) {
		registry.registerComponent(component);
	}
	return registry._componentMap.get(component)?.id as number;
}

/**
 * Helper function to register component masks with proper parent type
 */
function registerComponentMask(
	queryRegistry: TQueryRegistry,
	queryData: TQueryData,
	component: TComponentRef,
	maskType: 'with' | 'without' | 'added' | 'changed' | 'removed',
	parentType: TQueryParentType = 'And'
): void {
	const registry = queryRegistry._componentRegistry;
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
