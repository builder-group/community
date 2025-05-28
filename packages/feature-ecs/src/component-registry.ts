/**
 * Component Registry for ECS (Entity Component System)
 *
 * Provides efficient component management with direct array access for maximum performance.
 * Uses sparse arrays for component tracking and bitflags for fast component checks.
 *
 * Key features:
 * - O(1) component checks using bitflags
 * - Direct array access for component data
 * - Memory-efficient sparse array storage
 * - Cache-friendly iteration patterns
 * - Unlimited components via generation system
 * - Flexible component structure - supports multiple patterns
 */

import { TEntityId } from './entity-index';

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
 * const Position: { x: number[]; y: number[] } = { x: [], y: [] };     // Object with arrays (AoS)
 * const Transform: { x: number; y: number }[] = [];                    // Array of objects (SoA)
 * const Health: number[] = [];                                         // Single value array
 * const Player: {} = {};                                               // Tag component
 *
 * // Register all components
 * registry.registerComponent(Position);
 * registry.registerComponent(Transform);
 * registry.registerComponent(Health);
 * registry.registerComponent(Player);
 *
 * const eid = 1;
 *
 * // Add components and set data
 * registry.addComponent(eid, Position);
 * Position.x[eid] = 10;
 * Position.y[eid] = 20;
 *
 * registry.addComponent(eid, Transform);
 * Transform[eid] = { x: 5, y: 15 };
 *
 * registry.addComponent(eid, Health);
 * Health[eid] = 100;
 *
 * registry.addComponent(eid, Player); // Just a flag, no data
 * ```
 */
export function createComponentRegistry(): TComponentRegistry {
	return {
		_componentMap: new Map(),
		_entityMasks: [[]],
		_componentCount: 0,
		_currentBitflag: 1,

		registerComponent(component) {
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
			}

			return componentData;
		},

		hasComponent(eid, component) {
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
		//             addComponent(eid=5, Armor) where Armor.generationId=1, bitflag=1 ↓
		//
		// Step 1:     Get current mask: entityMasks[1][5] || 0 = 0
		// Step 2:     Set component bit: 0 | 1 = 1
		// Step 3:     Store new mask: entityMasks[1][5] = 1
		//
		// After:      entityMasks: [[<1 empty>, 5, <3 empty>, 2], [<5 empty>, 1]]  (entity 5 has Armor)
		addComponent(eid, component) {
			// Auto-register component if not already registered
			if (!this._componentMap.has(component)) {
				this.registerComponent(component);
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
		},

		// Component Removal Flow
		// Before:     entityMasks: [[<1 empty>, 5, <3 empty>, 2], [<5 empty>, 1]]
		//             removeComponent(eid=5, Armor) where Armor.generationId=1, bitflag=1 ↓
		//
		// Step 1:     Get current mask: entityMasks[1][5] = 1
		// Step 2:     Check component exists: 1 & 1 = 1 ✓
		// Step 3:     Clear component bit: 1 & ~1 = 0
		// Step 4:     Clear component data
		//
		// After:      entityMasks: [[<1 empty>, 5, <3 empty>, 2], [<5 empty>, 0]]  (entity 5 no longer has Armor)
		removeComponent(eid, component) {
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

		removeAllComponents(eid) {
			// Use removeComponent to reuse logic and ensure consistency
			for (const component of this._componentMap.keys()) {
				this.removeComponent(eid, component);
			}
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
			this._entityMasks.push([]); // Start with one generation
			this._componentCount = 0;
			this._currentBitflag = 1;
		},

		validate() {
			// Validate generation structure
			if (this._entityMasks.length === 0) {
				return false;
			}

			// Validate bitflag consistency within generations
			const generationCounts = new Array(this._entityMasks.length).fill(0);

			for (const componentData of this._componentMap.values()) {
				const { generationId, bitflag } = componentData;

				// Check generation ID is valid
				if (generationId >= this._entityMasks.length || generationId < 0) return false;

				// Check bitflag is a power of 2 and within valid range
				if (bitflag <= 0 || bitflag >= 2 ** 31 || (bitflag & (bitflag - 1)) !== 0) return false;

				generationCounts[generationId]++;
			}

			// Validate current bitflag matches expected value for current generation
			const currentGeneration = this._entityMasks.length - 1;
			const componentsInCurrentGen = generationCounts[currentGeneration] || 0;
			const expectedBitflag = componentsInCurrentGen === 0 ? 1 : 2 ** (componentsInCurrentGen % 31);

			if (this._currentBitflag !== expectedBitflag) {
				return false;
			}

			return true;
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

	/**
	 * Registers a component and returns its metadata.
	 * Uses generation system to support unlimited components.
	 * @param component - The component to register (can be array or object with arrays)
	 * @returns Component metadata including ID, generation, and bitflag
	 */
	registerComponent(component: TComponentRef): TComponentData;

	/**
	 * Checks if an entity has a specific component.
	 * @param eid - The entity ID
	 * @param component - The component to check
	 * @returns True if entity has the component
	 */
	hasComponent(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Adds a component to an entity (sets the component bit).
	 * Component data should be set directly on the component arrays.
	 * @param eid - The entity ID
	 * @param component - The component to add
	 */
	addComponent(eid: TEntityId, component: TComponentRef): void;

	/**
	 * Removes a component from an entity and clears its data.
	 * @param eid - The entity ID
	 * @param component - The component to remove
	 * @returns True if component was removed, false if entity didn't have it
	 */
	removeComponent(eid: TEntityId, component: TComponentRef): boolean;

	/**
	 * Removes all components from an entity.
	 * @param eid - The entity ID
	 */
	removeAllComponents(eid: TEntityId): void;

	/**
	 * Resets the registry to its initial empty state.
	 */
	reset(): void;

	/**
	 * Validates the internal data structure integrity.
	 * @returns True if the data structure is valid, false otherwise
	 */
	validate(): boolean;
}

export interface TComponentData {
	/** Unique component ID */
	id: number;
	/** Generation ID (which mask array this component uses) */
	generationId: number;
	/** Bitflag for this component (power of 2) */
	bitflag: number;
	/** Reference to the component object */
	ref: TComponentRef;
}

export type TComponentRef = any; // Can be array or object with arrays
