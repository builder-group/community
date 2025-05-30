import { TComponentRef } from '../component';
import { TEntityId } from '../entity';
import { TWorld } from '../world';
import { TQueryData, TQueryFilter } from './types';

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
			// Register callbacks to invalidate this query when components are added/removed
			world._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});
			world._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});

			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData != null) {
				const { generationId, bitflag } = componentData;

				// Lazy allocation: only create objects when needed
				if (queryData.withMasks == null) {
					queryData.withMasks = {};
				}
				if (queryData.affectedMasks == null) {
					queryData.affectedMasks = {};
				}

				queryData.withMasks[generationId] = (queryData.withMasks[generationId] ?? 0) | bitflag;
				queryData.affectedMasks[generationId] =
					(queryData.affectedMasks[generationId] ?? 0) | bitflag;

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
			// Register callbacks to invalidate this query when components are added/removed
			world._componentRegistry.onComponentAdd(component, () => {
				queryData.isDirty = true;
			});
			world._componentRegistry.onComponentRemove(component, () => {
				queryData.isDirty = true;
			});

			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);

			if (componentData != null) {
				const { generationId, bitflag } = componentData;

				// Lazy allocation: only create objects when needed
				if (queryData.withoutMasks == null) {
					queryData.withoutMasks = {};
				}
				if (queryData.affectedMasks == null) {
					queryData.affectedMasks = {};
				}

				queryData.withoutMasks[generationId] =
					(queryData.withoutMasks[generationId] ?? 0) | bitflag;
				queryData.affectedMasks[generationId] =
					(queryData.affectedMasks[generationId] ?? 0) | bitflag;

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

			// Register callback to invalidate when change tracking is flushed
			world._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register in change detection masks for potential bitmask evaluation
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);
			if (componentData != null) {
				const { generationId, bitflag } = componentData;

				// Lazy allocation: only create objects when needed
				if (queryData.addedMasks == null) {
					queryData.addedMasks = {};
				}
				if (queryData.affectedMasks == null) {
					queryData.affectedMasks = {};
				}

				queryData.addedMasks[generationId] = (queryData.addedMasks[generationId] ?? 0) | bitflag;
				queryData.affectedMasks[generationId] =
					(queryData.affectedMasks[generationId] ?? 0) | bitflag;

				// Add to generations array if not already present
				if (!queryData.generations.includes(generationId)) {
					queryData.generations.push(generationId);
				}
			}
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

			// Register callback to invalidate when change tracking is flushed
			world._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register in change detection masks for potential bitmask evaluation
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);
			if (componentData != null) {
				const { generationId, bitflag } = componentData;

				// Lazy allocation: only create objects when needed
				if (queryData.changedMasks == null) {
					queryData.changedMasks = {};
				}
				if (queryData.affectedMasks == null) {
					queryData.affectedMasks = {};
				}

				queryData.changedMasks[generationId] =
					(queryData.changedMasks[generationId] ?? 0) | bitflag;
				queryData.affectedMasks[generationId] =
					(queryData.affectedMasks[generationId] ?? 0) | bitflag;

				// Add to generations array if not already present
				if (!queryData.generations.includes(generationId)) {
					queryData.generations.push(generationId);
				}
			}
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

			// Register callback to invalidate when change tracking is flushed
			world._componentRegistry.onComponentFlush(component, () => {
				queryData.isDirty = true;
			});

			// Register in change detection masks for potential bitmask evaluation
			const registry = world._componentRegistry;
			const componentData = registry._componentMap.get(component);
			if (componentData != null) {
				const { generationId, bitflag } = componentData;

				// Lazy allocation: only create objects when needed
				if (queryData.removedMasks == null) {
					queryData.removedMasks = {};
				}
				if (queryData.affectedMasks == null) {
					queryData.affectedMasks = {};
				}

				queryData.removedMasks[generationId] =
					(queryData.removedMasks[generationId] ?? 0) | bitflag;
				queryData.affectedMasks[generationId] =
					(queryData.affectedMasks[generationId] ?? 0) | bitflag;

				// Add to generations array if not already present
				if (!queryData.generations.includes(generationId)) {
					queryData.generations.push(generationId);
				}
			}
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
			switch (queryData.evaluationStrategy) {
				case 'bitmask': {
					const {
						withMasks,
						withoutMasks,
						orMasks,
						addedMasks,
						changedMasks,
						removedMasks,
						generations
					} = queryData;
					const entityMasks = world._componentRegistry._entityMasks;
					const registryAddedMasks = world._componentRegistry._addedMasks;
					const registryChangedMasks = world._componentRegistry._changedMasks;
					const registryRemovedMasks = world._componentRegistry._removedMasks;

					// Check each generation for any AND match
					for (let i = 0; i < generations.length; i++) {
						const generationId = generations[i] as number;
						const entityMask = entityMasks[generationId]?.[eid] ?? 0;

						// WITH check: entity must have ALL required components
						const withMask = withMasks?.[generationId];
						if (withMask != null && (entityMask & withMask) !== withMask) {
							return false;
						}

						// WITHOUT check: entity must have NONE of the forbidden components
						const withoutMask = withoutMasks?.[generationId];
						if (withoutMask != null && (entityMask & withoutMask) !== 0) {
							return false;
						}

						// OR check: entity must satisfy AT LEAST ONE OR requirement
						const orMask = orMasks?.[generationId];
						if (orMask != null) {
							let hasOrMatch = false;

							// OR WITH: entity has AT LEAST ONE of the OR components
							if (orMask.with != null && (entityMask & orMask.with) !== 0) {
								hasOrMatch = true;
							}

							// OR WITHOUT: entity lacks AT LEAST ONE of the OR-forbidden components
							if (
								!hasOrMatch &&
								orMask.without != null &&
								(entityMask & orMask.without) !== orMask.without
							) {
								hasOrMatch = true;
							}

							// OR change detection checks
							if (!hasOrMatch && orMask.added != null) {
								const entityAddedMask = registryAddedMasks[generationId]?.[eid] ?? 0;
								if ((entityAddedMask & orMask.added) !== 0) {
									hasOrMatch = true;
								}
							}

							if (!hasOrMatch && orMask.changed != null) {
								const entityChangedMask = registryChangedMasks[generationId]?.[eid] ?? 0;
								if ((entityChangedMask & orMask.changed) !== 0) {
									hasOrMatch = true;
								}
							}

							if (!hasOrMatch && orMask.removed != null) {
								const entityRemovedMask = registryRemovedMasks[generationId]?.[eid] ?? 0;
								if ((entityRemovedMask & orMask.removed) !== 0) {
									hasOrMatch = true;
								}
							}

							if (!hasOrMatch) {
								return false;
							}
						}

						// ADDED check: entity must have ALL added components
						const addedMask = addedMasks?.[generationId];
						if (addedMask != null) {
							const entityAddedMask = registryAddedMasks[generationId]?.[eid] ?? 0;
							if ((entityAddedMask & addedMask) !== addedMask) {
								return false;
							}
						}

						// CHANGED check: entity must have ALL changed components
						const changedMask = changedMasks?.[generationId];
						if (changedMask != null) {
							const entityChangedMask = registryChangedMasks[generationId]?.[eid] ?? 0;
							if ((entityChangedMask & changedMask) !== changedMask) {
								return false;
							}
						}

						// REMOVED check: entity must have ALL removed components
						const removedMask = removedMasks?.[generationId];
						if (removedMask != null) {
							const entityRemovedMask = registryRemovedMasks[generationId]?.[eid] ?? 0;
							if ((entityRemovedMask & removedMask) !== removedMask) {
								return false;
							}
						}
					}

					return true;
				}

				// Individual filter evaluation for more complex queries
				case 'individual':
					return filters.every((filter) => filter.evaluate(world, eid, queryData));
			}
		},

		register(world: TWorld, queryData: TQueryData): void {
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
			switch (queryData.evaluationStrategy) {
				case 'bitmask': {
					const { orMasks, generations } = queryData;

					if (orMasks == null) {
						return false;
					}

					const entityMasks = world._componentRegistry._entityMasks;
					const registryAddedMasks = world._componentRegistry._addedMasks;
					const registryChangedMasks = world._componentRegistry._changedMasks;
					const registryRemovedMasks = world._componentRegistry._removedMasks;

					// Check each generation for any OR match
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

				// Individual filter evaluation for more complex queries
				case 'individual':
					return filters.some((filter) => filter.evaluate(world, eid, queryData));
			}
		},

		register(world: TWorld, queryData: TQueryData): void {
			for (const filter of filters) {
				if (filter.register != null) {
					filter.register(world, queryData);
				}
			}

			// For bitmask evaluation, move individual masks to OR masks for all supported types
			if (queryData.evaluationStrategy === 'bitmask') {
				for (const filter of filters) {
					// Only handle component filters that have a component property
					if (
						filter.type !== 'With' &&
						filter.type !== 'Without' &&
						filter.type !== 'Added' &&
						filter.type !== 'Changed' &&
						filter.type !== 'Removed'
					) {
						continue;
					}

					const registry = world._componentRegistry;
					const componentData = registry._componentMap.get(filter.component);
					if (componentData == null) {
						continue;
					}

					const { generationId, bitflag } = componentData;

					// Lazy allocation for orMasks
					if (queryData.orMasks == null) {
						queryData.orMasks = {};
					}
					if (queryData.orMasks[generationId] == null) {
						queryData.orMasks[generationId] = {};
					}

					switch (filter.type) {
						case 'With':
							// Move from withMasks to orMasks.with
							queryData.orMasks[generationId].with =
								(queryData.orMasks[generationId].with ?? 0) | bitflag;
							if (queryData.withMasks?.[generationId] != null) {
								queryData.withMasks[generationId] =
									(queryData.withMasks[generationId] ?? 0) & ~bitflag;
							}
							break;
						case 'Without':
							// Move from withoutMasks to orMasks.without
							queryData.orMasks[generationId].without =
								(queryData.orMasks[generationId].without ?? 0) | bitflag;
							if (queryData.withoutMasks?.[generationId] != null) {
								queryData.withoutMasks[generationId] =
									(queryData.withoutMasks[generationId] ?? 0) & ~bitflag;
							}
							break;
						case 'Added':
							// Move from addedMasks to orMasks.added
							queryData.orMasks[generationId].added =
								(queryData.orMasks[generationId].added ?? 0) | bitflag;
							if (queryData.addedMasks?.[generationId] != null) {
								queryData.addedMasks[generationId] =
									(queryData.addedMasks[generationId] ?? 0) & ~bitflag;
							}
							break;
						case 'Changed':
							// Move from changedMasks to orMasks.changed
							queryData.orMasks[generationId].changed =
								(queryData.orMasks[generationId].changed ?? 0) | bitflag;
							if (queryData.changedMasks?.[generationId] != null) {
								queryData.changedMasks[generationId] =
									(queryData.changedMasks[generationId] ?? 0) & ~bitflag;
							}
							break;
						case 'Removed':
							// Move from removedMasks to orMasks.removed
							queryData.orMasks[generationId].removed =
								(queryData.orMasks[generationId].removed ?? 0) | bitflag;
							if (queryData.removedMasks?.[generationId] != null) {
								queryData.removedMasks[generationId] =
									(queryData.removedMasks[generationId] ?? 0) & ~bitflag;
							}
							break;
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
