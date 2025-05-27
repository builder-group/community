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
 *
 * ## Supported Component Patterns
 *
 * ### 1. Object with Array Properties (Performance Optimized)
 * Best for components with multiple properties. Each property is stored in a separate array
 * for maximum cache efficiency and performance.
 * ```typescript
 * type TPosition = { x: number[]; y: number[] };
 * const Position: TPosition = { x: [], y: [] };
 *
 * // Usage: Position.x[eid] = 10; Position.y[eid] = 20;
 * ```
 *
 * ### 2. Array of Objects (Simple but Less Performant)
 * Easier to understand but less cache-friendly. Good for prototyping or when performance
 * isn't critical.
 * ```typescript
 * type TTransform = { x: number; y: number; rotation: number }[];
 * const Transform: TTransform = [];
 *
 * // Usage: Transform[eid] = { x: 10, y: 20, rotation: 0 };
 * ```
 *
 * ### 3. Single Value Array
 * For components that store a single value per entity.
 * ```typescript
 * type THealth = number[];
 * const Health: THealth = [];
 *
 * // Usage: Health[eid] = 100;
 * ```
 *
 * ### 4. Tag Components (Markers)
 * For components that just mark entities as having a certain property.
 * No data storage needed.
 * ```typescript
 * type TPlayer = {};
 * const Player: TPlayer = {};
 *
 * // Usage: registry.addComponent(eid, Player); // Just marks entity as player
 * ```
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
 * const Position: { x: number[]; y: number[] } = { x: [], y: [] };     // Object with arrays
 * const Transform: { x: number; y: number }[] = [];                    // Array of objects
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
				return this._componentMap.get(component)!;
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
			const mask = this._entityMasks[generationId]?.[eid];
			return mask != null && (mask & bitflag) !== 0;
		},

		// Component Addition Flow with Generations
		// Generation 0: [Position, Velocity, Health, ...] (components 0-30, bitflags 1-2^30)
		// Generation 1: [Armor, Weapon, ...] (components 31+, bitflags 1-2^30)
		//
		// Before:     entityMasks: [[0, 5, 0, 2], [0, 0, 1, 0]]
		//             addComponent(eid=2, Armor) where Armor.generationId=1, bitflag=1 ↓
		//
		// Step 1:     Get generation 1 mask: entityMasks[1][2] = 1
		// Step 2:     Set component bit: 1 | 1 = 1
		// Step 3:     Store new mask: entityMasks[1][2] = 1
		//
		// After:      entityMasks: [[0, 5, 0, 2], [0, 0, 1, 0]]  (entity 2 has Armor)
		addComponent(eid, component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				throw new Error('Component not registered. Call registerComponent() first.');
			}

			const { generationId, bitflag } = componentData;

			// Ensure generation exists and has capacity for this entity
			this._ensureGenerationCapacity(generationId, eid);

			// Set component bit in the appropriate generation
			const currentMask = this._entityMasks[generationId]![eid] || 0;
			this._entityMasks[generationId]![eid] = currentMask | bitflag;
		},

		// Component Removal Flow with Generations
		// Before:     entityMasks: [[0, 5, 4, 2], [0, 0, 1, 0]]
		//             removeComponent(eid=2, Armor) where Armor.generationId=1, bitflag=1 ↓
		//
		// Step 1:     Get generation 1 mask: entityMasks[1][2] = 1
		// Step 2:     Check component exists: 1 & 1 = 1 ✓
		// Step 3:     Clear component bit: 1 & ~1 = 0
		// Step 4:     Clear component data
		//
		// After:      entityMasks: [[0, 5, 4, 2], [0, 0, 0, 0]]  (entity 2 no longer has Armor)
		removeComponent(eid, component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				return false;
			}

			const { generationId, bitflag } = componentData;

			if (
				generationId >= this._entityMasks.length ||
				eid >= this._entityMasks[generationId]!.length
			) {
				return false;
			}

			const currentMask = this._entityMasks[generationId]![eid] || 0;
			if ((currentMask & bitflag) === 0) return false;

			// Clear component bit
			this._entityMasks[generationId]![eid] = currentMask & ~bitflag;

			// Clear component data - handle both single array and object with arrays
			if (Array.isArray(component)) {
				// Single array component: Health[eid] = undefined
				component[eid] = undefined;
			} else {
				// Object with array properties: Position.x[eid] = undefined
				for (const key in component) {
					if (Array.isArray(component[key])) {
						component[key][eid] = undefined;
					}
				}
			}

			return true;
		},

		getEntitiesWithComponent(component) {
			const componentData = this._componentMap.get(component);
			if (componentData == null) {
				return [];
			}

			const entities: TEntityId[] = [];
			const { generationId, bitflag } = componentData;

			if (generationId >= this._entityMasks.length) return [];

			const generation = this._entityMasks[generationId]!;

			// Iterate through entity masks in this generation to find matches
			for (let eid = 0; eid < generation.length; eid++) {
				const mask = generation[eid];
				if (mask != null && (mask & bitflag) !== 0) {
					entities.push(eid);
				}
			}

			return entities;
		},

		// Multi-Component Query Flow with Generations
		// Query: getEntitiesWithComponents([Position, Armor])
		// where Position.generationId=0, bitflag=4 and Armor.generationId=1, bitflag=1
		//
		// Step 1:     Group components by generation:
		//             Generation 0: [Position] -> mask = 4
		//             Generation 1: [Armor] -> mask = 1
		// Step 2:     Check each entity across all generations:
		//             Entity must have: entityMasks[0][eid] & 4 === 4 AND entityMasks[1][eid] & 1 === 1
		//
		// Result:     Only entities that satisfy ALL generation requirements
		getEntitiesWithComponents(components) {
			if (components.length === 0) {
				return [];
			}
			if (components.length === 1) {
				return this.getEntitiesWithComponent(components[0]);
			}

			// Group components by generation and build required masks
			const generationMasks = new Map<number, number>();

			for (const component of components) {
				const componentData = this._componentMap.get(component);
				if (!componentData) return []; // If any component not registered, no entities can have all

				const { generationId, bitflag } = componentData;
				const currentMask = generationMasks.get(generationId) || 0;
				generationMasks.set(generationId, currentMask | bitflag);
			}

			const entities: TEntityId[] = [];

			// Find the maximum entity ID across all generations
			let maxEntityId = 0;
			for (const generation of this._entityMasks) {
				maxEntityId = Math.max(maxEntityId, generation.length);
			}

			// Check each entity against all generation requirements
			entityLoop: for (let eid = 0; eid < maxEntityId; eid++) {
				for (const [generationId, requiredMask] of generationMasks) {
					if (generationId >= this._entityMasks.length) continue entityLoop;

					const generation = this._entityMasks[generationId]!;
					const mask = generation[eid] || 0;

					if ((mask & requiredMask) !== requiredMask) {
						continue entityLoop;
					}
				}
				entities.push(eid);
			}

			return entities;
		},

		removeAllComponents(eid) {
			// Clear component data for all components this entity has across all generations
			for (const [component, componentData] of this._componentMap) {
				const { generationId, bitflag } = componentData;

				if (
					generationId >= this._entityMasks.length ||
					eid >= this._entityMasks[generationId]!.length
				) {
					continue;
				}

				const mask = this._entityMasks[generationId]![eid] || 0;
				if ((mask & bitflag) !== 0) {
					// Handle both single array and object with arrays
					if (Array.isArray(component)) {
						component[eid] = undefined;
					} else {
						for (const key in component) {
							if (Array.isArray(component[key])) {
								component[key][eid] = undefined;
							}
						}
					}
				}
			}

			// Clear entity masks across all generations
			for (let generationId = 0; generationId < this._entityMasks.length; generationId++) {
				if (eid < this._entityMasks[generationId]!.length) {
					this._entityMasks[generationId]![eid] = 0;
				}
			}
		},

		getEntityComponentMask(eid) {
			// Return combined mask information across all generations
			const masks: number[] = [];
			for (let generationId = 0; generationId < this._entityMasks.length; generationId++) {
				const generation = this._entityMasks[generationId]!;
				masks.push(eid < generation.length ? generation[eid] || 0 : 0);
			}
			return masks;
		},

		getComponentData(component) {
			return this._componentMap.get(component) || null;
		},

		getAllComponents() {
			return Array.from(this._componentMap.keys());
		},

		debugState() {
			const componentEntries = [];
			for (const [component, data] of this._componentMap) {
				const name = (component as any).name || `Component${data.id}`;
				componentEntries.push(
					`${name}(id:${data.id}, gen:${data.generationId}, flag:${data.bitflag})`
				);
			}

			const generationEntries = [];
			for (let genId = 0; genId < this._entityMasks.length; genId++) {
				const generation = this._entityMasks[genId]!;
				const entityEntries = [];
				for (let eid = 0; eid < generation.length; eid++) {
					const mask = generation[eid];
					if (mask != null && mask !== 0) {
						entityEntries.push(`${eid}→${mask.toString(2).padStart(8, '0')}`);
					}
				}
				if (entityEntries.length > 0) {
					generationEntries.push(`Gen${genId}: {${entityEntries.join(', ')}}`);
				}
			}

			return [
				`ComponentRegistry State:`,
				`  Components (${this._componentCount}): [${componentEntries.join(', ')}]`,
				`  Entity Masks: ${generationEntries.join(', ')}`,
				`  Generations: ${this._entityMasks.length}`,
				`  Next Bitflag: ${this._currentBitflag}`
			].join('\n');
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
			if (this._entityMasks.length === 0) return false;

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

			if (this._currentBitflag !== expectedBitflag) return false;

			return true;
		},

		_ensureGenerationCapacity(generationId, eid) {
			// Ensure the generation exists
			while (generationId >= this._entityMasks.length) {
				this._entityMasks.push([]);
			}

			// Ensure the generation array can accommodate this entity ID
			const generation = this._entityMasks[generationId]!;
			while (eid >= generation.length) {
				generation.push(0);
			}
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
	 * Gets all entities that have a specific component.
	 * @param component - The component to query
	 * @returns Array of entity IDs
	 */
	getEntitiesWithComponent(component: TComponentRef): TEntityId[];

	/**
	 * Gets entities that have ALL specified components.
	 * Works across multiple generations efficiently.
	 * @param components - Array of components that entities must have
	 * @returns Array of entity IDs
	 */
	getEntitiesWithComponents(components: TComponentRef[]): TEntityId[];

	/**
	 * Removes all components from an entity across all generations.
	 * @param eid - The entity ID
	 */
	removeAllComponents(eid: TEntityId): void;

	/**
	 * Gets the component bitmasks for an entity across all generations.
	 * @param eid - The entity ID
	 * @returns Array of bitmasks, one per generation
	 */
	getEntityComponentMask(eid: TEntityId): number[];

	/**
	 * Gets metadata for a registered component.
	 * @param component - The component
	 * @returns Component metadata or null if not registered
	 */
	getComponentData(component: TComponentRef): TComponentData | null;

	/**
	 * Gets all registered components.
	 * @returns Array of all component references
	 */
	getAllComponents(): TComponentRef[];

	/**
	 * Returns a human-readable debug representation of the registry state.
	 * Shows components with their generation and entity masks by generation.
	 * @returns Multi-line string with formatted state information
	 */
	debugState(): string;

	/**
	 * Resets the registry to its initial empty state.
	 */
	reset(): void;

	/**
	 * Validates the internal data structure integrity.
	 * @returns True if the data structure is valid, false otherwise
	 */
	validate(): boolean;

	/**
	 * Ensures a generation can accommodate the given entity ID.
	 * @param generationId - The generation ID
	 * @param eid - The entity ID
	 */
	_ensureGenerationCapacity(generationId: number, eid: TEntityId): void;
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
