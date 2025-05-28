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

	describe('change tracking', () => {
		it('should track component additions', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Initially, component should not be marked as added
			expect(registry.wasAdded(eid, Position)).toBe(false);

			// Add component
			registry.addComponent(eid, Position);

			// Now it should be marked as added
			expect(registry.wasAdded(eid, Position)).toBe(true);
			expect(registry.hasComponent(eid, Position)).toBe(true);
		});

		it('should track component removals', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Add component first
			registry.addComponent(eid, Position);
			expect(registry.wasRemoved(eid, Position)).toBe(false);

			// Remove component
			registry.removeComponent(eid, Position);

			// Now it should be marked as removed
			expect(registry.wasRemoved(eid, Position)).toBe(true);
			expect(registry.hasComponent(eid, Position)).toBe(false);
		});

		it('should track component changes', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Add component first
			registry.addComponent(eid, Position);
			expect(registry.wasChanged(eid, Position)).toBe(false);

			// Mark as changed
			const result = registry.markChanged(eid, Position);

			// Should be marked as changed
			expect(result).toBe(true);
			expect(registry.wasChanged(eid, Position)).toBe(true);
		});

		it('should not mark non-existent components as changed', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Try to mark non-existent component as changed
			const result = registry.markChanged(eid, Position);

			// Should fail
			expect(result).toBe(false);
			expect(registry.wasChanged(eid, Position)).toBe(false);
		});

		it('should clear frame changes', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const eid = 1;

			// Add components and mark changes
			registry.addComponent(eid, Position);
			registry.addComponent(eid, Health);
			registry.markChanged(eid, Position);
			registry.removeComponent(eid, Health);

			// Verify changes are tracked
			expect(registry.wasAdded(eid, Position)).toBe(true);
			expect(registry.wasChanged(eid, Position)).toBe(true);
			expect(registry.wasRemoved(eid, Health)).toBe(true);

			// Clear frame changes
			registry.clear();

			// Changes should be cleared
			expect(registry.wasAdded(eid, Position)).toBe(false);
			expect(registry.wasChanged(eid, Position)).toBe(false);
			expect(registry.wasRemoved(eid, Health)).toBe(false);

			// But component state should remain
			expect(registry.hasComponent(eid, Position)).toBe(true);
			expect(registry.hasComponent(eid, Health)).toBe(false);
		});

		it('should handle multiple entities and components', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const eid1 = 1;
			const eid2 = 2;

			// Entity 1: Add Position, mark changed
			registry.addComponent(eid1, Position);
			registry.markChanged(eid1, Position);

			// Entity 2: Add Health, remove it
			registry.addComponent(eid2, Health);
			registry.removeComponent(eid2, Health);

			// Verify tracking for entity 1
			expect(registry.wasAdded(eid1, Position)).toBe(true);
			expect(registry.wasChanged(eid1, Position)).toBe(true);
			expect(registry.wasRemoved(eid1, Health)).toBe(false);

			// Verify tracking for entity 2
			expect(registry.wasAdded(eid2, Health)).toBe(true);
			expect(registry.wasRemoved(eid2, Health)).toBe(true);
			expect(registry.wasChanged(eid2, Position)).toBe(false);
		});

		it('should work with multi-generation components', () => {
			// Create 32 components to trigger generation overflow
			const components = Array.from({ length: 32 }, (_, i) => ({ [`prop${i}`]: [] as number[] }));
			const eid = 1;

			// Register all components (this will create multiple generations)
			components.forEach((comp) => registry.registerComponent(comp));

			// Add components from different generations
			registry.addComponent(eid, components[0]); // Generation 0
			registry.addComponent(eid, components[31]); // Generation 1

			// Verify tracking works across generations
			expect(registry.wasAdded(eid, components[0])).toBe(true);
			expect(registry.wasAdded(eid, components[31])).toBe(true);

			// Mark changes and verify
			registry.markChanged(eid, components[0]);
			registry.markChanged(eid, components[31]);

			expect(registry.wasChanged(eid, components[0])).toBe(true);
			expect(registry.wasChanged(eid, components[31])).toBe(true);
		});
	});

	describe('callback system', () => {
		it('should call onAdd callbacks when components are added', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const eid1 = 1;
			const eid2 = 2;

			// Setup callbacks
			const positionAddedEntities: number[] = [];
			const healthAddedEntities: number[] = [];

			registry.onComponentAdd(Position, (eid) => {
				positionAddedEntities.push(eid);
			});

			registry.onComponentAdd(Health, (eid) => {
				healthAddedEntities.push(eid);
			});

			// Add components
			registry.addComponent(eid1, Position);
			registry.addComponent(eid1, Health);
			registry.addComponent(eid2, Position);

			// Verify callbacks were called
			expect(positionAddedEntities).toEqual([eid1, eid2]);
			expect(healthAddedEntities).toEqual([eid1]);
		});

		it('should call onChange callbacks when components are marked as changed', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const eid1 = 1;
			const eid2 = 2;

			// Add components first
			registry.addComponent(eid1, Position);
			registry.addComponent(eid1, Health);
			registry.addComponent(eid2, Position);

			// Setup callbacks
			const positionChangedEntities: number[] = [];
			const healthChangedEntities: number[] = [];

			registry.onComponentChange(Position, (eid) => {
				positionChangedEntities.push(eid);
			});

			registry.onComponentChange(Health, (eid) => {
				healthChangedEntities.push(eid);
			});

			// Mark components as changed
			registry.markChanged(eid1, Position);
			registry.markChanged(eid1, Health);
			registry.markChanged(eid2, Position);

			// Verify callbacks were called
			expect(positionChangedEntities).toEqual([eid1, eid2]);
			expect(healthChangedEntities).toEqual([eid1]);
		});

		it('should call onRemove callbacks when components are removed', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const eid1 = 1;
			const eid2 = 2;

			// Add components first
			registry.addComponent(eid1, Position);
			registry.addComponent(eid1, Health);
			registry.addComponent(eid2, Position);

			// Setup callbacks
			const positionRemovedEntities: number[] = [];
			const healthRemovedEntities: number[] = [];

			registry.onComponentRemove(Position, (eid) => {
				positionRemovedEntities.push(eid);
			});

			registry.onComponentRemove(Health, (eid) => {
				healthRemovedEntities.push(eid);
			});

			// Remove components
			registry.removeComponent(eid1, Position);
			registry.removeComponent(eid1, Health);
			registry.removeComponent(eid2, Position);

			// Verify callbacks were called
			expect(positionRemovedEntities).toEqual([eid1, eid2]);
			expect(healthRemovedEntities).toEqual([eid1]);
		});

		it('should not call callbacks for non-existent operations', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Setup callbacks
			let addCallCount = 0;
			let changeCallCount = 0;
			let removeCallCount = 0;

			registry.onComponentAdd(Position, () => addCallCount++);
			registry.onComponentChange(Position, () => changeCallCount++);
			registry.onComponentRemove(Position, () => removeCallCount++);

			// Try to mark non-existent component as changed
			registry.markChanged(eid, Position);
			expect(changeCallCount).toBe(0);

			// Try to remove non-existent component
			registry.removeComponent(eid, Position);
			expect(removeCallCount).toBe(0);

			// Add component (should trigger callback)
			registry.addComponent(eid, Position);
			expect(addCallCount).toBe(1);

			// Try to add same component again (should not trigger callback)
			registry.addComponent(eid, Position);
			expect(addCallCount).toBe(1);
		});

		it('should handle multiple callbacks for same component', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Setup multiple callbacks
			const callback1Calls: number[] = [];
			const callback2Calls: number[] = [];

			registry.onComponentAdd(Position, (eid) => callback1Calls.push(eid));
			registry.onComponentAdd(Position, (eid) => callback2Calls.push(eid));

			// Add component
			registry.addComponent(eid, Position);

			// Both callbacks should be called
			expect(callback1Calls).toEqual([eid]);
			expect(callback2Calls).toEqual([eid]);
		});

		it('should support unregister functions', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			const callbackResults: string[] = [];

			// Register multiple callbacks
			const unregister1 = registry.onComponentAdd(Position, () => {
				callbackResults.push('callback1');
			});

			const unregister2 = registry.onComponentAdd(Position, () => {
				callbackResults.push('callback2');
			});

			const unregister3 = registry.onComponentAdd(Position, () => {
				callbackResults.push('callback3');
			});

			// Add component - all callbacks should fire
			registry.addComponent(eid, Position);
			expect(callbackResults).toEqual(['callback1', 'callback2', 'callback3']);

			// Unregister middle callback
			unregister2();

			// Reset and test again
			callbackResults.length = 0;
			registry.removeComponent(eid, Position);
			registry.addComponent(eid, Position);

			// Only callback1 and callback3 should fire
			expect(callbackResults).toEqual(['callback1', 'callback3']);

			// Unregister all remaining
			unregister1();
			unregister3();

			// Reset and test again
			callbackResults.length = 0;
			registry.removeComponent(eid, Position);
			registry.addComponent(eid, Position);

			// No callbacks should fire
			expect(callbackResults).toEqual([]);
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
