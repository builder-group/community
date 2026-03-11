import { TEntityId } from '../entity';
import { TComponentData, TComponentRef, TUpdateComponentValue } from './types';

/**
 * Creates a new component registry.
 *
 * @returns A new component registry instance
 *
 * @example
 * ```typescript
 * const registry = createComponentRegistry();
 *
 * // Define components using any supported pattern
 * const Transform: { x: number; y: number }[] = [];                    // Array of objects (AoS)
 * const Position: { x: number[]; y: number[] } = { x: [], y: [] };     // Object with array properties (SoA)
 * const Health: number[] = [];                                         // Single value array
 * const Player: {} = {};                                               // Marker component
 *
 * // Register all components
 * registry.register(Position);
 * registry.register(Transform);
 * registry.register(Health);
 * registry.register(Player);
 *
 * const eid = 1;
 *
 * // Add components and set data
 * registry.add(eid, Position);
 * Position.x[eid] = 10;
 * Position.y[eid] = 20;
 *
 * registry.add(eid, Transform);
 * Transform[eid] = { x: 5, y: 15 };
 *
 * registry.add(eid, Health);
 * Health[eid] = 100;
 *
 * registry.add(eid, Player); // Just a flag, no data
 * ```
 */
export function createComponentRegistry(): TComponentRegistry {
	return {
		_componentMap: new Map(),
		_entityMasks: [[]],
		_componentCount: 0,
		_currentBitflag: 1,

		_addedMasks: [[]],
		_changedMasks: [[]],
		_removedMasks: [[]],

		_callbacks: new Map(),
		_componentsToFlush: new Set(),

		register(component) {
			if (this._componentMap.has(component)) {
				return this._componentMap.get(component) as TComponentData;
			}

			const componentData: TComponentData = {
				id: this._componentCount++,
				generationId: this._entityMasks.length - 1,
				bitflag: this._currentBitflag,
				ref: component
			};

			this._componentMap.set(component, componentData);

			// When we exceed 31 bits, start a new generation
			this._currentBitflag *= 2;
			if (this._currentBitflag >= 2 ** 31) {
				this._currentBitflag = 1;
				this._entityMasks.push([]);
				this._addedMasks.push([]);
				this._changedMasks.push([]);
				this._removedMasks.push([]);
			}

			return componentData;
		},

		has(eid, component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;
			const mask = this._entityMasks[generationId]?.[eid] ?? 0;
			return (mask & bitflag) !== 0;
		},

		// Component Addition Flow
		// Generation 0: [Position, Velocity, Health, ...] (components 0-30, bitflags 1-2^30)
		// Generation 1: [Armor, Weapon, ...] (components 31+, bitflags 1-2^30)
		//
		// Before:     entityMasks: [[<1 empty>, 5, <3 empty>, 2], []]
		//             add(eid=5, Armor) where Armor.generationId=1, bitflag=1 ↓
		//
		// Step 1:     Get current mask: entityMasks[1][5] || 0 = 0
		// Step 2:     Set component bit: 0 | 1 = 1
		// Step 3:     Store new mask: entityMasks[1][5] = 1
		//
		// After:      entityMasks: [[<1 empty>, 5, <3 empty>, 2], [<5 empty>, 1]]  (entity 5 has Armor)
		add<GComponent extends TComponentRef>(
			eid: TEntityId,
			component: GComponent,
			value?: TUpdateComponentValue<GComponent>
		): void {
			// Auto-register component if not already registered
			if (!this._componentMap.has(component)) {
				this.register(component);
			}

			const componentData = this._componentMap.get(component) as TComponentData;
			const { generationId, bitflag } = componentData;

			// Check if entity already has this component
			const currentMask = this._entityMasks[generationId]?.[eid] ?? 0;
			if ((currentMask & bitflag) !== 0) {
				return;
			}

			// Set component bit in the appropriate generation
			// We don't prefill arrays to create sparse arrays for memory efficiency
			// @ts-expect-error - generationId exists because we ensure it when registering the component
			this._entityMasks[generationId][eid] = currentMask | bitflag;

			// Track that this component was added this frame
			const currentAddedMask = this._addedMasks[generationId]?.[eid] ?? 0;
			// @ts-expect-error - generationId exists because we ensure it when registering the component
			this._addedMasks[generationId][eid] = currentAddedMask | bitflag;

			// Set component data if value is provided
			if (value !== undefined) {
				this.update(eid, component, value, false);
			}

			// Fire callbacks if registered
			const callbacks = this._callbacks.get(component);
			if (callbacks?.onAdd != null) {
				for (const callback of callbacks.onAdd) {
					callback(eid);
				}
			}
			this._componentsToFlush.add(component);
		},

		update<GComponent extends TComponentRef>(
			eid: TEntityId,
			component: GComponent,
			value: TUpdateComponentValue<GComponent>,
			markAsChanged = true
		): void {
			// Array of objects (AoS) or single value array component: Health[eid] = value
			if (Array.isArray(component)) {
				component[eid] = value;
				if (markAsChanged) {
					this.markChanged(eid, component);
				}
				return;
			}

			// Marker component (empty object): add/remove based on boolean
			if (
				typeof component === 'object' &&
				component !== null &&
				Object.keys(component).length === 0
			) {
				if (value === true && !this.has(eid, component)) {
					this.add(eid, component);
				} else if (value === false) {
					this.remove(eid, component);
				}
				return;
			}

			// Object with array properties component (SoA): Position.x[eid] = value.x
			if (typeof component === 'object' && component !== null) {
				const valueObj = value as Record<string, any>;
				for (const [key, val] of Object.entries(valueObj)) {
					const targetArray = (component as Record<string, any[]>)[key];
					if (Array.isArray(targetArray)) {
						targetArray[eid] = val;
					}
				}
				if (markAsChanged) {
					this.markChanged(eid, component);
				}
				return;
			}
		},

		// Component Removal Flow
		// Before:     entityMasks: [[<1 empty>, 5, <3 empty>, 2], [<5 empty>, 1]]
		//             remove(eid=5, Armor) where Armor.generationId=1, bitflag=1 ↓
		//
		// Step 1:     Get current mask: entityMasks[1][5] = 1
		// Step 2:     Check component exists: 1 & 1 = 1 ✓
		// Step 3:     Clear component bit: 1 & ~1 = 0
		// Step 4:     Clear component data
		//
		// After:      entityMasks: [[<1 empty>, 5, <3 empty>, 2], [<5 empty>, 0]]  (entity 5 no longer has Armor)
		remove(eid, component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;

			// Get current mask and check if entity actually has this component
			const currentMask = this._entityMasks[generationId]?.[eid] ?? 0;
			if ((currentMask & bitflag) === 0) {
				return false;
			}

			// Track that this component was removed this frame
			const currentRemovedMask = this._removedMasks[generationId]?.[eid] ?? 0;
			// @ts-expect-error - generationId exists because we ensure it when registering the component
			this._removedMasks[generationId][eid] = currentRemovedMask | bitflag;

			// Fire callbacks if registered
			const callbacks = this._callbacks.get(component);
			if (callbacks?.onRemove != null) {
				for (const callback of callbacks.onRemove) {
					callback(eid);
				}
			}
			this._componentsToFlush.add(component);

			// Clear component bit
			// @ts-expect-error - generationId exists because we ensure it when registering the component
			this._entityMasks[generationId][eid] = currentMask & ~bitflag;

			// Clear component data (AoS or SoA)
			if (Array.isArray(component)) {
				// Single array component (AoS): delete Health[eid]
				delete component[eid];
			} else {
				// Object with array properties (SoA): delete Position.x[eid]
				for (const key in component) {
					if (Array.isArray(component[key])) {
						delete component[key][eid];
					}
				}
			}

			return true;
		},

		removeAll(eid) {
			for (const component of this._componentMap.keys()) {
				this.remove(eid, component);
			}
		},

		markChanged(eid, component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;

			// Only mark as changed if entity actually has this component
			const currentMask = this._entityMasks[generationId]?.[eid] ?? 0;
			if ((currentMask & bitflag) === 0) {
				return false;
			}

			// Track that this component was changed this frame
			const currentChangedMask = this._changedMasks[generationId]?.[eid] ?? 0;
			// @ts-expect-error - generationId exists because we ensure it when registering the component
			this._changedMasks[generationId][eid] = currentChangedMask | bitflag;

			// Fire callbacks if registered
			const callbacks = this._callbacks.get(component);
			if (callbacks?.onChange != null) {
				for (const callback of callbacks.onChange) {
					callback(eid);
				}
			}
			this._componentsToFlush.add(component);

			return true;
		},

		wasAdded(eid, component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;
			const mask = this._addedMasks[generationId]?.[eid] ?? 0;
			return (mask & bitflag) !== 0;
		},

		wasChanged(eid, component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;
			const mask = this._changedMasks[generationId]?.[eid] ?? 0;
			return (mask & bitflag) !== 0;
		},

		wasRemoved(eid, component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;
			const mask = this._removedMasks[generationId]?.[eid] ?? 0;
			return (mask & bitflag) !== 0;
		},

		onAdd(component, callback) {
			if (!this._callbacks.has(component)) {
				this._callbacks.set(component, {});
			}
			const componentCallbacks = this._callbacks.get(component) as TComponentCallbacks;
			if (componentCallbacks.onAdd == null) {
				componentCallbacks.onAdd = [];
			}
			componentCallbacks.onAdd.push(callback);

			// Return unregister function
			return () => {
				const index = componentCallbacks.onAdd?.indexOf(callback);
				if (index != null && index !== -1) {
					componentCallbacks.onAdd?.splice(index, 1);
				}
			};
		},

		onChange(component, callback) {
			if (!this._callbacks.has(component)) {
				this._callbacks.set(component, {});
			}
			const componentCallbacks = this._callbacks.get(component) as TComponentCallbacks;
			if (componentCallbacks.onChange == null) {
				componentCallbacks.onChange = [];
			}
			componentCallbacks.onChange.push(callback);

			// Return unregister function
			return () => {
				const index = componentCallbacks.onChange?.indexOf(callback);
				if (index != null && index !== -1) {
					componentCallbacks.onChange?.splice(index, 1);
				}
			};
		},

		onRemove(component, callback) {
			if (!this._callbacks.has(component)) {
				this._callbacks.set(component, {});
			}
			const componentCallbacks = this._callbacks.get(component) as TComponentCallbacks;
			if (componentCallbacks.onRemove == null) {
				componentCallbacks.onRemove = [];
			}
			componentCallbacks.onRemove.push(callback);

			// Return unregister function
			return () => {
				const index = componentCallbacks.onRemove?.indexOf(callback);
				if (index != null && index !== -1) {
					componentCallbacks.onRemove?.splice(index, 1);
				}
			};
		},

		onFlush(component, callback) {
			if (!this._callbacks.has(component)) {
				this._callbacks.set(component, {});
			}
			const componentCallbacks = this._callbacks.get(component) as TComponentCallbacks;
			if (componentCallbacks.onFlush == null) {
				componentCallbacks.onFlush = [];
			}
			componentCallbacks.onFlush.push(callback);

			// Return unregister function
			return () => {
				const index = componentCallbacks.onFlush?.indexOf(callback);
				if (index != null && index !== -1) {
					componentCallbacks.onFlush?.splice(index, 1);
				}
			};
		},

		flush() {
			// Clear all change tracking for the next frame
			for (let generationId = 0; generationId < this._addedMasks.length; generationId++) {
				if (this._addedMasks[generationId] != null) {
					// @ts-expect-error - generationId exists because we checked above
					this._addedMasks[generationId].length = 0;
				}
				if (this._changedMasks[generationId] != null) {
					// @ts-expect-error - generationId exists because we checked above
					this._changedMasks[generationId].length = 0;
				}
				if (this._removedMasks[generationId] != null) {
					// @ts-expect-error - generationId exists because we checked above
					this._removedMasks[generationId].length = 0;
				}
			}

			// Call flush callbacks for components that had changes
			for (const component of this._componentsToFlush) {
				const callbacks = this._callbacks.get(component);
				if (callbacks?.onFlush != null) {
					for (const callback of callbacks.onFlush) {
						callback();
					}
				}
			}

			// Clear the set for next frame
			this._componentsToFlush.clear();
		},

		reset() {
			// Clear all component data arrays
			for (const component of this._componentMap.keys()) {
				if (Array.isArray(component)) {
					// Single array component
					component.length = 0;
				} else {
					// Object with array properties
					for (const key in component) {
						if (Array.isArray(component[key])) {
							component[key].length = 0;
						}
					}
				}
			}

			this._componentMap.clear();
			this._entityMasks.length = 0;
			this._entityMasks.push([]);
			this._addedMasks.length = 0;
			this._addedMasks.push([]);
			this._changedMasks.length = 0;
			this._changedMasks.push([]);
			this._removedMasks.length = 0;
			this._removedMasks.push([]);
			this._componentCount = 0;
			this._currentBitflag = 1;
			this._callbacks.clear();
			this._componentsToFlush.clear();
		}
	};
}

export interface TComponentRegistry {
	/** Map of component references to their metadata */
	_componentMap: Map<TComponentRef, TComponentData>;
	/** Array of entity component masks by generation */
	_entityMasks: number[][];
	/** Number of registered components */
	_componentCount: number;
	/** Current bitflag value for next component */
	_currentBitflag: number;

	/** Array of added component masks by generation */
	_addedMasks: number[][];
	/** Array of changed component masks by generation */
	_changedMasks: number[][];
	/** Array of removed component masks by generation */
	_removedMasks: number[][];

	/** Optional callback system for real-time reactions */
	_callbacks: Map<TComponentRef, TComponentCallbacks>;
	/** Set of components that need to be flushed for the next frame */
	_componentsToFlush: Set<TComponentRef>;

	/**
	 * Registers a component and returns its metadata.
	 * Uses generation system to support unlimited components.
	 * @param component - The component to register (can be array or object with arrays)
	 * @returns Component metadata including ID, generation, and bitflag
	 */
	register(component: TComponentRef): TComponentData;

	/**
	 * Checks if an entity has a specific component.
	 * @param eid - The entity ID
	 * @param component - The component to check
	 * @returns True if entity has the component
	 */
	has(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Adds a component to an entity (sets the component bit).
	 * Component data should be set directly on the component arrays.
	 * @param eid - The entity ID
	 * @param component - The component to add
	 */
	add<GComponent extends TComponentRef>(
		eid: TEntityId,
		component: GComponent,
		value?: TUpdateComponentValue<GComponent>
	): void;

	/**
	 * Updates component values with type safety.
	 * - For arrays: sets value directly
	 * - For marker components (empty objects): true adds component, false removes it
	 * - For objects with arrays: sets each property value
	 * @param markAsChanged - Whether to mark the component as changed (default: true)
	 */
	update<GComponent extends TComponentRef>(
		eid: TEntityId,
		component: GComponent,
		value: TUpdateComponentValue<GComponent>,
		markAsChanged?: boolean
	): void;

	/**
	 * Removes a component from an entity and clears its data.
	 * @param eid - The entity ID
	 * @param component - The component to remove
	 * @returns True if component was removed, false if entity didn't have it
	 */
	remove(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Removes all components from an entity.
	 * @param eid - The entity ID
	 */
	removeAll(eid: TEntityId): void;

	/**
	 * Marks a component as changed for the current frame.
	 * @param eid - The entity ID
	 * @param component - The component to mark as changed
	 * @returns True if component was marked as changed, false if entity didn't have it
	 */
	markChanged(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Checks if a component was added to an entity in the current frame.
	 * @param eid - The entity ID
	 * @param component - The component to check
	 * @returns True if component was added to the entity in the current frame
	 */
	wasAdded(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Checks if a component was changed for an entity in the current frame.
	 * @param eid - The entity ID
	 * @param component - The component to check
	 * @returns True if component was changed for the entity in the current frame
	 */
	wasChanged(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Checks if a component was removed from an entity in the current frame.
	 * @param eid - The entity ID
	 * @param component - The component to check
	 * @returns True if component was removed from the entity in the current frame
	 */
	wasRemoved(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Registers a callback for when a component is added to an entity.
	 * @param component - The component to register the callback for
	 * @param callback - The callback function to register
	 */
	onAdd(component: TComponentRef, callback: (eid: TEntityId) => void): () => void;

	/**
	 * Registers a callback for when a component is changed for an entity.
	 * @param component - The component to register the callback for
	 * @param callback - The callback function to register
	 */
	onChange(component: TComponentRef, callback: (eid: TEntityId) => void): () => void;

	/**
	 * Registers a callback for when a component is removed from an entity.
	 * @param component - The component to register the callback for
	 * @param callback - The callback function to register
	 */
	onRemove(component: TComponentRef, callback: (eid: TEntityId) => void): () => void;

	/**
	 * Registers a callback for when a component is flushed for an entity.
	 * @param component - The component to register the callback for
	 * @param callback - The callback function to register
	 */
	onFlush(component: TComponentRef, callback: () => void): () => void;

	/**
	 * Clears all change tracking for the current frame.
	 */
	flush(): void;

	/**
	 * Resets the registry to its initial empty state.
	 */
	reset(): void;
}

export interface TComponentCallbacks {
	onAdd?: ((eid: TEntityId) => void)[];
	onChange?: ((eid: TEntityId) => void)[];
	onRemove?: ((eid: TEntityId) => void)[];
	onFlush?: (() => void)[];
}
