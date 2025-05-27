import { beforeEach, describe, expect, it } from 'vitest';
import { createComponentRegistry, TComponentRegistry } from './component-registry';
import { createEntityIndex, TEntityIndex } from './entity-index';

describe('createComponentRegistry', () => {
	let registry: TComponentRegistry;
	let entityIndex: TEntityIndex;

	beforeEach(() => {
		registry = createComponentRegistry();
		entityIndex = createEntityIndex();
	});

	describe('registerComponent', () => {
		it('should register components and return metadata', () => {
			const Position: TPosition = { x: [], y: [] };
			const Transform: TTransform = [];
			const Health: THealth = [];
			const Player: TPlayer = {};

			const posData = registry.registerComponent(Position);
			const transformData = registry.registerComponent(Transform);
			const healthData = registry.registerComponent(Health);
			const playerData = registry.registerComponent(Player);

			expect(posData.id).toBe(0);
			expect(posData.generationId).toBe(0);
			expect(posData.bitflag).toBe(1);
			expect(posData.ref).toBe(Position);

			expect(transformData.id).toBe(1);
			expect(transformData.generationId).toBe(0);
			expect(transformData.bitflag).toBe(2);
			expect(transformData.ref).toBe(Transform);

			expect(healthData.id).toBe(2);
			expect(healthData.generationId).toBe(0);
			expect(healthData.bitflag).toBe(4);
			expect(healthData.ref).toBe(Health);

			expect(playerData.id).toBe(3);
			expect(playerData.generationId).toBe(0);
			expect(playerData.bitflag).toBe(8);
			expect(playerData.ref).toBe(Player);

			// Re-registering should return same data
			const posData2 = registry.registerComponent(Position);
			expect(posData2).toBe(posData);
		});

		it('should support unlimited components', () => {
			// Register 35 components to test generation overflow
			const components = [];
			for (let i = 0; i < 35; i++) {
				const component = {};
				components.push(component);
				const data = registry.registerComponent(component);

				if (i < 31) {
					// First generation (0-30)
					expect(data.generationId).toBe(0);
					expect(data.bitflag).toBe(2 ** i);
				} else {
					// Second generation (31-34)
					expect(data.generationId).toBe(1);
					expect(data.bitflag).toBe(2 ** (i - 31));
				}
			}
		});
	});

	describe('hasComponent', () => {
		it('should return true for entities with components', () => {
			const Position: TPosition = { x: [], y: [] };
			const Health: THealth = [];

			registry.registerComponent(Position);
			registry.registerComponent(Health);

			const eid1 = entityIndex.addEntity();
			const eid2 = entityIndex.addEntity();

			registry.addComponent(eid1, Position);
			registry.addComponent(eid1, Health);
			registry.addComponent(eid2, Position);

			expect(registry.hasComponent(eid1, Position)).toBe(true);
			expect(registry.hasComponent(eid1, Health)).toBe(true);
			expect(registry.hasComponent(eid2, Position)).toBe(true);
			expect(registry.hasComponent(eid2, Health)).toBe(false);
		});

		it('should return false for unregistered components', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.addEntity();

			expect(registry.hasComponent(eid, Position)).toBe(false);
		});
	});

	describe('addComponent', () => {
		it('should support object with array properties pattern (AoS)', () => {
			const Position: TPosition = { x: [], y: [] };
			const Velocity: TVelocity = { dx: [], dy: [] };

			registry.registerComponent(Position);
			registry.registerComponent(Velocity);

			const eid1 = entityIndex.addEntity();
			const eid2 = entityIndex.addEntity();

			// Add components
			registry.addComponent(eid1, Position);
			registry.addComponent(eid1, Velocity);
			registry.addComponent(eid2, Position);

			// Set data on separate arrays for each property
			Position.x[eid1] = 10;
			Position.y[eid1] = 20;
			Velocity.dx[eid1] = 1;
			Velocity.dy[eid1] = 2;
			Position.x[eid2] = 30;
			Position.y[eid2] = 40;

			// Check components
			expect(registry.hasComponent(eid1, Position)).toBe(true);
			expect(registry.hasComponent(eid1, Velocity)).toBe(true);
			expect(registry.hasComponent(eid2, Position)).toBe(true);
			expect(registry.hasComponent(eid2, Velocity)).toBe(false);

			// Verify data
			expect(Position.x[eid1]).toBe(10);
			expect(Position.y[eid1]).toBe(20);
			expect(Velocity.dx[eid1]).toBe(1);
			expect(Velocity.dy[eid1]).toBe(2);
			expect(Position.x[eid2]).toBe(30);
			expect(Position.y[eid2]).toBe(40);
		});

		it('should support array of objects pattern (SoA)', () => {
			const Transform: TTransform = [];
			const RenderInfo: TRenderInfo = [];

			registry.registerComponent(Transform);
			registry.registerComponent(RenderInfo);

			const eid1 = entityIndex.addEntity();
			const eid2 = entityIndex.addEntity();

			// Add components
			registry.addComponent(eid1, Transform);
			registry.addComponent(eid1, RenderInfo);
			registry.addComponent(eid2, Transform);

			// Set data as complete objects
			Transform[eid1] = { x: 5, y: 15, rotation: 45 };
			RenderInfo[eid1] = { sprite: 'player.png', layer: 1, visible: true };
			Transform[eid2] = { x: 100, y: 200, rotation: 0 };

			// Check components
			expect(registry.hasComponent(eid1, Transform)).toBe(true);
			expect(registry.hasComponent(eid1, RenderInfo)).toBe(true);
			expect(registry.hasComponent(eid2, Transform)).toBe(true);
			expect(registry.hasComponent(eid2, RenderInfo)).toBe(false);

			// Verify data
			expect(Transform[eid1]).toEqual({ x: 5, y: 15, rotation: 45 });
			expect(RenderInfo[eid1]).toEqual({ sprite: 'player.png', layer: 1, visible: true });
			expect(Transform[eid2]).toEqual({ x: 100, y: 200, rotation: 0 });
		});

		it('should support single value array pattern', () => {
			const Health: THealth = [];
			const Mana: TMana = [];
			const Level: TLevel = [];

			registry.registerComponent(Health);
			registry.registerComponent(Mana);
			registry.registerComponent(Level);

			const eid1 = entityIndex.addEntity();
			const eid2 = entityIndex.addEntity();

			// Add components
			registry.addComponent(eid1, Health);
			registry.addComponent(eid1, Mana);
			registry.addComponent(eid1, Level);
			registry.addComponent(eid2, Health);

			// Set single values
			Health[eid1] = 100;
			Mana[eid1] = 50;
			Level[eid1] = 5;
			Health[eid2] = 80;

			// Check components
			expect(registry.hasComponent(eid1, Health)).toBe(true);
			expect(registry.hasComponent(eid1, Mana)).toBe(true);
			expect(registry.hasComponent(eid1, Level)).toBe(true);
			expect(registry.hasComponent(eid2, Health)).toBe(true);
			expect(registry.hasComponent(eid2, Mana)).toBe(false);

			// Verify data
			expect(Health[eid1]).toBe(100);
			expect(Mana[eid1]).toBe(50);
			expect(Level[eid1]).toBe(5);
			expect(Health[eid2]).toBe(80);
		});

		it('should support tag component pattern', () => {
			const Player: TPlayer = {};
			const Enemy: TEnemy = {};
			const Frozen: TFrozen = {};

			registry.registerComponent(Player);
			registry.registerComponent(Enemy);
			registry.registerComponent(Frozen);

			const eid1 = entityIndex.addEntity();
			const eid2 = entityIndex.addEntity();
			const eid3 = entityIndex.addEntity();

			// Add tag components (no data, just flags)
			registry.addComponent(eid1, Player);
			registry.addComponent(eid1, Frozen);
			registry.addComponent(eid2, Enemy);
			registry.addComponent(eid3, Player);

			// Check components
			expect(registry.hasComponent(eid1, Player)).toBe(true);
			expect(registry.hasComponent(eid1, Enemy)).toBe(false);
			expect(registry.hasComponent(eid1, Frozen)).toBe(true);
			expect(registry.hasComponent(eid2, Player)).toBe(false);
			expect(registry.hasComponent(eid2, Enemy)).toBe(true);
			expect(registry.hasComponent(eid3, Player)).toBe(true);
			expect(registry.hasComponent(eid3, Frozen)).toBe(false);
		});

		it('should auto-register components when adding', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.addEntity();

			// Component should be auto-registered when adding
			registry.addComponent(eid, Position);
			expect(registry.hasComponent(eid, Position)).toBe(true);

			// Should be able to set data
			Position.x[eid] = 10;
			Position.y[eid] = 20;
			expect(Position.x[eid]).toBe(10);
			expect(Position.y[eid]).toBe(20);
		});

		it('should handle duplicate component addition as idempotent', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.addEntity();

			// Add component multiple times
			registry.addComponent(eid, Position);
			registry.addComponent(eid, Position);
			registry.addComponent(eid, Position);

			// Should still only have it once
			expect(registry.hasComponent(eid, Position)).toBe(true);

			// Set data
			Position.x[eid] = 10;
			Position.y[eid] = 20;

			// Remove once should remove it completely
			expect(registry.removeComponent(eid, Position)).toBe(true);
			expect(registry.hasComponent(eid, Position)).toBe(false);
			expect(Position.x[eid]).toBeUndefined();
			expect(Position.y[eid]).toBeUndefined();

			// Removing again should return false
			expect(registry.removeComponent(eid, Position)).toBe(false);
		});

		it('should work across multiple generations', () => {
			const eid = entityIndex.addEntity();

			// Register 35 components to test generation overflow
			const components = [];
			for (let i = 0; i < 35; i++) {
				const component = {};
				components.push(component);
				registry.registerComponent(component);
			}

			// Add components from both generations
			registry.addComponent(eid, components[0]!); // Gen 0, bitflag 1
			registry.addComponent(eid, components[30]!); // Gen 0, bitflag 2^30
			registry.addComponent(eid, components[31]!); // Gen 1, bitflag 1
			registry.addComponent(eid, components[34]!); // Gen 1, bitflag 8

			// Verify components exist
			expect(registry.hasComponent(eid, components[0]!)).toBe(true);
			expect(registry.hasComponent(eid, components[30]!)).toBe(true);
			expect(registry.hasComponent(eid, components[31]!)).toBe(true);
			expect(registry.hasComponent(eid, components[34]!)).toBe(true);
		});
	});

	describe('removeComponent', () => {
		it('should remove components and clear data', () => {
			const Position: TPosition = { x: [], y: [] };
			const Transform: TTransform = [];
			const Health: THealth = [];

			registry.registerComponent(Position);
			registry.registerComponent(Transform);
			registry.registerComponent(Health);

			const eid = entityIndex.addEntity();

			// Add components and set data
			registry.addComponent(eid, Position);
			registry.addComponent(eid, Transform);
			registry.addComponent(eid, Health);

			Position.x[eid] = 10;
			Position.y[eid] = 20;
			Transform[eid] = { x: 5, y: 15, rotation: 45 };
			Health[eid] = 100;

			// Remove Position component
			expect(registry.removeComponent(eid, Position)).toBe(true);
			expect(registry.hasComponent(eid, Position)).toBe(false);
			expect(Position.x[eid]).toBeUndefined();
			expect(Position.y[eid]).toBeUndefined();

			// Other components should still exist
			expect(registry.hasComponent(eid, Transform)).toBe(true);
			expect(registry.hasComponent(eid, Health)).toBe(true);
			expect(Transform[eid]).toEqual({ x: 5, y: 15, rotation: 45 });
			expect(Health[eid]).toBe(100);
		});

		it('should return false for non-existent components', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.addEntity();

			expect(registry.removeComponent(eid, Position)).toBe(false);
		});

		it('should return false for already removed components', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.addEntity();

			registry.addComponent(eid, Position);
			expect(registry.removeComponent(eid, Position)).toBe(true);
			expect(registry.removeComponent(eid, Position)).toBe(false);
		});

		it('should work across multiple generations', () => {
			const Position: TPosition = { x: [], y: [] };
			const Transform: TTransform = [];
			const Health: THealth = [];
			const Player: TPlayer = {};

			// Add some gen 0 components first
			const gen0Components = [];
			for (let i = 0; i < 31; i++) {
				const component = {};
				gen0Components.push(component);
				registry.registerComponent(component);
			}

			// These will be in generation 1
			registry.registerComponent(Position);
			registry.registerComponent(Transform);
			registry.registerComponent(Health);
			registry.registerComponent(Player);

			const eid = entityIndex.addEntity();

			// Add components from both generations
			registry.addComponent(eid, gen0Components[0]!);
			registry.addComponent(eid, Position);
			registry.addComponent(eid, Transform);
			registry.addComponent(eid, Health);
			registry.addComponent(eid, Player);

			// Set data
			Position.x[eid] = 10;
			Position.y[eid] = 20;
			Transform[eid] = { x: 5, y: 15, rotation: 45 };
			Health[eid] = 100;

			// Remove components from different generations
			registry.removeComponent(eid, Position);
			expect(registry.hasComponent(eid, Position)).toBe(false);
			expect(Position.x[eid]).toBeUndefined();
			expect(Position.y[eid]).toBeUndefined();

			registry.removeComponent(eid, gen0Components[0]!);
			expect(registry.hasComponent(eid, gen0Components[0]!)).toBe(false);

			// Other components should still exist
			expect(registry.hasComponent(eid, Transform)).toBe(true);
			expect(registry.hasComponent(eid, Health)).toBe(true);
			expect(registry.hasComponent(eid, Player)).toBe(true);
		});
	});

	describe('removeAllComponents', () => {
		it('should remove all components from entity', () => {
			const Position: TPosition = { x: [], y: [] };
			const Transform: TTransform = [];
			const Health: THealth = [];
			const Player: TPlayer = {};

			registry.registerComponent(Position);
			registry.registerComponent(Transform);
			registry.registerComponent(Health);
			registry.registerComponent(Player);

			const eid = entityIndex.addEntity();

			// Add components and set data
			registry.addComponent(eid, Position);
			registry.addComponent(eid, Transform);
			registry.addComponent(eid, Health);
			registry.addComponent(eid, Player);

			Position.x[eid] = 10;
			Position.y[eid] = 20;
			Transform[eid] = { x: 5, y: 15, rotation: 45 };
			Health[eid] = 100;

			// Remove all components
			registry.removeAllComponents(eid);

			// All components should be removed
			expect(registry.hasComponent(eid, Position)).toBe(false);
			expect(registry.hasComponent(eid, Transform)).toBe(false);
			expect(registry.hasComponent(eid, Health)).toBe(false);
			expect(registry.hasComponent(eid, Player)).toBe(false);

			// All data should be cleared
			expect(Position.x[eid]).toBeUndefined();
			expect(Position.y[eid]).toBeUndefined();
			expect(Transform[eid]).toBeUndefined();
			expect(Health[eid]).toBeUndefined();
		});
	});

	describe('reset', () => {
		it('should reset to initial state and clear all data', () => {
			const Position: TPosition = { x: [], y: [] };

			// Create multiple generations
			const gen0Components = [];
			for (let i = 0; i < 31; i++) {
				const component = {};
				gen0Components.push(component);
				registry.registerComponent(component);
			}

			registry.registerComponent(Position);

			const eid = entityIndex.addEntity();

			registry.addComponent(eid, gen0Components[0]!);
			registry.addComponent(eid, Position);
			Position.x[eid] = 10;

			// Verify data exists
			expect(Position.x[eid]).toBe(10);
			expect(registry.hasComponent(eid, Position)).toBe(true);

			// Reset registry
			registry.reset();

			// All arrays should be cleared
			expect(Position.x.length).toBe(0);

			// Registry should be empty
			expect(registry.hasComponent(eid, Position)).toBe(false);
			expect(registry.validate()).toBe(true);
		});
	});

	describe('validate', () => {
		it('should return true for valid empty registry', () => {
			expect(registry.validate()).toBe(true);
		});

		it('should return true for valid registry with components', () => {
			const Position: TPosition = { x: [], y: [] };
			const Health: THealth = [];

			registry.registerComponent(Position);
			registry.registerComponent(Health);

			expect(registry.validate()).toBe(true);
		});

		it('should return true after component operations', () => {
			const Position: TPosition = { x: [], y: [] };
			const Health: THealth = [];

			registry.registerComponent(Position);
			registry.registerComponent(Health);

			const eid1 = entityIndex.addEntity();
			const eid2 = entityIndex.addEntity();

			registry.addComponent(eid1, Position);
			registry.addComponent(eid1, Health);
			registry.addComponent(eid2, Position);

			expect(registry.validate()).toBe(true);

			registry.removeComponent(eid1, Health);
			expect(registry.validate()).toBe(true);

			registry.removeAllComponents(eid2);
			expect(registry.validate()).toBe(true);
		});

		it('should return true with generation system', () => {
			// Register 35 components to test generation overflow
			const components = [];
			for (let i = 0; i < 35; i++) {
				const component = {};
				components.push(component);
				registry.registerComponent(component);
			}

			expect(registry.validate()).toBe(true);

			const eid = entityIndex.addEntity();
			registry.addComponent(eid, components[0]!); // Gen 0
			registry.addComponent(eid, components[31]!); // Gen 1

			expect(registry.validate()).toBe(true);
		});

		it('should return true after reset', () => {
			const Position: TPosition = { x: [], y: [] };
			registry.registerComponent(Position);

			const eid = entityIndex.addEntity();
			registry.addComponent(eid, Position);

			registry.reset();

			expect(registry.validate()).toBe(true);
		});
	});
});

// 1. Object with Array Properties (Performance Optimized)
type TPosition = { x: number[]; y: number[] };
type TVelocity = { dx: number[]; dy: number[] };

// 2. Array of Objects (Simple but Less Performant)
type TTransform = { x: number; y: number; rotation: number }[];
type TRenderInfo = { sprite: string; layer: number; visible: boolean }[];

// 3. Single Value Array
type THealth = number[];
type TMana = number[];
type TLevel = number[];

// 4. Tag Components (Markers)
type TPlayer = {};
type TEnemy = {};
type TFrozen = {};
