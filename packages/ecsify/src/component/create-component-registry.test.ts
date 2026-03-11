import { beforeEach, describe, expect, it } from 'vitest';
import { createEntityIndex, TEntityIndex } from '../entity/create-entity-index';
import { createComponentRegistry, TComponentRegistry } from './create-component-registry';

describe('createComponentRegistry', () => {
	let registry: TComponentRegistry;
	let entityIndex: TEntityIndex;

	beforeEach(() => {
		registry = createComponentRegistry();
		entityIndex = createEntityIndex();
	});

	describe('register', () => {
		it('should register components and return metadata', () => {
			const Position: TPosition = { x: [], y: [] };
			const Transform: TTransform = [];
			const Health: THealth = [];
			const Player: TPlayer = {};

			const posData = registry.register(Position);
			const transformData = registry.register(Transform);
			const healthData = registry.register(Health);
			const playerData = registry.register(Player);

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
			const posData2 = registry.register(Position);
			expect(posData2).toBe(posData);
		});

		it('should support unlimited components', () => {
			// Register 35 components to test generation overflow
			const components = [];
			for (let i = 0; i < 35; i++) {
				const component = {};
				components.push(component);
				const data = registry.register(component);

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

	describe('has', () => {
		it('should return true for entities with components', () => {
			const Position: TPosition = { x: [], y: [] };
			const Health: THealth = [];

			registry.register(Position);
			registry.register(Health);

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			registry.add(eid1, Position);
			registry.add(eid1, Health);
			registry.add(eid2, Position);

			expect(registry.has(eid1, Position)).toBe(true);
			expect(registry.has(eid1, Health)).toBe(true);
			expect(registry.has(eid2, Position)).toBe(true);
			expect(registry.has(eid2, Health)).toBe(false);
		});

		it('should return false for unregistered components', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.createEntity();

			expect(registry.has(eid, Position)).toBe(false);
		});
	});

	describe('add', () => {
		it('should support array of objects pattern (AoS)', () => {
			const Transform: TTransform = [];
			const RenderInfo: TRenderInfo = [];

			registry.register(Transform);
			registry.register(RenderInfo);

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Add components
			registry.add(eid1, Transform);
			registry.add(eid1, RenderInfo);
			registry.add(eid2, Transform);

			// Set data as complete objects
			Transform[eid1] = { x: 5, y: 15, rotation: 45 };
			RenderInfo[eid1] = { sprite: 'player.png', layer: 1, visible: true };
			Transform[eid2] = { x: 100, y: 200, rotation: 0 };

			// Check components
			expect(registry.has(eid1, Transform)).toBe(true);
			expect(registry.has(eid1, RenderInfo)).toBe(true);
			expect(registry.has(eid2, Transform)).toBe(true);
			expect(registry.has(eid2, RenderInfo)).toBe(false);

			// Verify data
			expect(Transform[eid1]).toEqual({ x: 5, y: 15, rotation: 45 });
			expect(RenderInfo[eid1]).toEqual({ sprite: 'player.png', layer: 1, visible: true });
			expect(Transform[eid2]).toEqual({ x: 100, y: 200, rotation: 0 });
		});

		it('should support object with array properties pattern (SoA)', () => {
			const Position: TPosition = { x: [], y: [] };
			const Velocity: TVelocity = { dx: [], dy: [] };

			registry.register(Position);
			registry.register(Velocity);

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Add components
			registry.add(eid1, Position);
			registry.add(eid1, Velocity);
			registry.add(eid2, Position);

			// Set data on separate arrays for each property
			Position.x[eid1] = 10;
			Position.y[eid1] = 20;
			Velocity.dx[eid1] = 1;
			Velocity.dy[eid1] = 2;
			Position.x[eid2] = 30;
			Position.y[eid2] = 40;

			// Check components
			expect(registry.has(eid1, Position)).toBe(true);
			expect(registry.has(eid1, Velocity)).toBe(true);
			expect(registry.has(eid2, Position)).toBe(true);
			expect(registry.has(eid2, Velocity)).toBe(false);

			// Verify data
			expect(Position.x[eid1]).toBe(10);
			expect(Position.y[eid1]).toBe(20);
			expect(Velocity.dx[eid1]).toBe(1);
			expect(Velocity.dy[eid1]).toBe(2);
			expect(Position.x[eid2]).toBe(30);
			expect(Position.y[eid2]).toBe(40);
		});

		it('should support single value array pattern', () => {
			const Health: THealth = [];
			const Mana: TMana = [];
			const Level: TLevel = [];

			registry.register(Health);
			registry.register(Mana);
			registry.register(Level);

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();

			// Add components
			registry.add(eid1, Health);
			registry.add(eid1, Mana);
			registry.add(eid1, Level);
			registry.add(eid2, Health);

			// Set single values
			Health[eid1] = 100;
			Mana[eid1] = 50;
			Level[eid1] = 5;
			Health[eid2] = 80;

			// Check components
			expect(registry.has(eid1, Health)).toBe(true);
			expect(registry.has(eid1, Mana)).toBe(true);
			expect(registry.has(eid1, Level)).toBe(true);
			expect(registry.has(eid2, Health)).toBe(true);
			expect(registry.has(eid2, Mana)).toBe(false);

			// Verify data
			expect(Health[eid1]).toBe(100);
			expect(Mana[eid1]).toBe(50);
			expect(Level[eid1]).toBe(5);
			expect(Health[eid2]).toBe(80);
		});

		it('should support marker component pattern', () => {
			const Player: TPlayer = {};
			const Enemy: TEnemy = {};
			const Frozen: TFrozen = {};

			registry.register(Player);
			registry.register(Enemy);
			registry.register(Frozen);

			const eid1 = entityIndex.createEntity();
			const eid2 = entityIndex.createEntity();
			const eid3 = entityIndex.createEntity();

			// Add marker components (no data, just flags)
			registry.add(eid1, Player);
			registry.add(eid1, Frozen);
			registry.add(eid2, Enemy);
			registry.add(eid3, Player);

			// Check components
			expect(registry.has(eid1, Player)).toBe(true);
			expect(registry.has(eid1, Enemy)).toBe(false);
			expect(registry.has(eid1, Frozen)).toBe(true);
			expect(registry.has(eid2, Player)).toBe(false);
			expect(registry.has(eid2, Enemy)).toBe(true);
			expect(registry.has(eid3, Player)).toBe(true);
			expect(registry.has(eid3, Frozen)).toBe(false);
		});

		it('should auto-register components when adding', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.createEntity();

			// Component should be auto-registered when adding
			registry.add(eid, Position);
			expect(registry.has(eid, Position)).toBe(true);

			// Should be able to set data
			Position.x[eid] = 10;
			Position.y[eid] = 20;
			expect(Position.x[eid]).toBe(10);
			expect(Position.y[eid]).toBe(20);
		});

		it('should handle duplicate component addition as idempotent', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.createEntity();

			// Add component multiple times
			registry.add(eid, Position);
			registry.add(eid, Position);
			registry.add(eid, Position);

			// Should still only have it once
			expect(registry.has(eid, Position)).toBe(true);

			// Set data
			Position.x[eid] = 10;
			Position.y[eid] = 20;

			// Remove once should remove it completely
			expect(registry.remove(eid, Position)).toBe(true);
			expect(registry.has(eid, Position)).toBe(false);
			expect(Position.x[eid]).toBeUndefined();
			expect(Position.y[eid]).toBeUndefined();

			// Removing again should return false
			expect(registry.remove(eid, Position)).toBe(false);
		});

		it('should work across multiple generations', () => {
			const eid = entityIndex.createEntity();

			// Register 35 components to test generation overflow
			const components = [];
			for (let i = 0; i < 35; i++) {
				const component = {};
				components.push(component);
				registry.register(component);
			}

			// Add components from both generations
			registry.add(eid, components[0]!); // Gen 0, bitflag 1
			registry.add(eid, components[30]!); // Gen 0, bitflag 2^30
			registry.add(eid, components[31]!); // Gen 1, bitflag 1
			registry.add(eid, components[34]!); // Gen 1, bitflag 8

			// Verify components exist
			expect(registry.has(eid, components[0]!)).toBe(true);
			expect(registry.has(eid, components[30]!)).toBe(true);
			expect(registry.has(eid, components[31]!)).toBe(true);
			expect(registry.has(eid, components[34]!)).toBe(true);
		});
	});

	describe('update', () => {
		it('should update array components and mark as changed by default', () => {
			const Health: THealth = [];
			const eid = entityIndex.createEntity();

			registry.add(eid, Health);
			registry.update(eid, Health, 100);

			expect(Health[eid]).toBe(100);
			expect(registry.wasChanged(eid, Health)).toBe(true);
		});

		it('should update array components without marking as changed when explicitly false', () => {
			const Health: THealth = [];
			const eid = entityIndex.createEntity();

			registry.add(eid, Health);
			registry.update(eid, Health, 75, false);

			expect(Health[eid]).toBe(75);
			expect(registry.wasChanged(eid, Health)).toBe(false);
		});

		it('should update object with array properties (SoA) and mark as changed by default', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.createEntity();

			registry.add(eid, Position);
			registry.update(eid, Position, { x: 10, y: 20 });

			expect(Position.x[eid]).toBe(10);
			expect(Position.y[eid]).toBe(20);
			expect(registry.wasChanged(eid, Position)).toBe(true);
		});

		it('should update object with arrays without marking as changed when explicitly false', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.createEntity();

			registry.add(eid, Position);
			registry.update(eid, Position, { x: 15, y: 25 }, false);

			expect(Position.x[eid]).toBe(15);
			expect(Position.y[eid]).toBe(25);
			expect(registry.wasChanged(eid, Position)).toBe(false);
		});

		it('should add marker component when value is true', () => {
			const Player: TPlayer = {};
			const eid = entityIndex.createEntity();

			registry.update(eid, Player, true);

			expect(registry.has(eid, Player)).toBe(true);
			expect(registry.wasAdded(eid, Player)).toBe(true);
		});

		it('should remove marker component when value is false', () => {
			const Player: TPlayer = {};
			const eid = entityIndex.createEntity();

			registry.add(eid, Player);
			registry.update(eid, Player, false);

			expect(registry.has(eid, Player)).toBe(false);
			expect(registry.wasRemoved(eid, Player)).toBe(true);
		});

		it('should not add marker component if already present', () => {
			const Player: TPlayer = {};
			const eid = entityIndex.createEntity();

			registry.add(eid, Player);
			const wasAddedBefore = registry.wasAdded(eid, Player);

			registry.flush(); // Clear tracking
			registry.update(eid, Player, true);

			expect(registry.has(eid, Player)).toBe(true);
			expect(registry.wasAdded(eid, Player)).toBe(false); // Should not be marked as added again
		});

		it('should handle partial object updates', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.createEntity();

			registry.add(eid, Position);
			Position.x[eid] = 100;
			Position.y[eid] = 200;

			registry.update(eid, Position, { x: 50 }, false);

			expect(Position.x[eid]).toBe(50);
			expect(Position.y[eid]).toBe(200); // Should remain unchanged
		});

		it('should handle mixed array types in objects', () => {
			const Mixed = { numbers: [] as number[], strings: [] as string[] };
			const eid = entityIndex.createEntity();

			registry.add(eid, Mixed);
			registry.update(eid, Mixed, { numbers: 42, strings: 'test' }, false);

			expect(Mixed.numbers[eid]).toBe(42);
			expect(Mixed.strings[eid]).toBe('test');
		});
	});

	describe('remove', () => {
		it('should remove components and clear data', () => {
			const Position: TPosition = { x: [], y: [] };
			const Transform: TTransform = [];
			const Health: THealth = [];

			registry.register(Position);
			registry.register(Transform);
			registry.register(Health);

			const eid = entityIndex.createEntity();

			// Add components and set data
			registry.add(eid, Position);
			registry.add(eid, Transform);
			registry.add(eid, Health);

			Position.x[eid] = 10;
			Position.y[eid] = 20;
			Transform[eid] = { x: 5, y: 15, rotation: 45 };
			Health[eid] = 100;

			// Remove Position component
			expect(registry.remove(eid, Position)).toBe(true);
			expect(registry.has(eid, Position)).toBe(false);
			expect(Position.x[eid]).toBeUndefined();
			expect(Position.y[eid]).toBeUndefined();

			// Other components should still exist
			expect(registry.has(eid, Transform)).toBe(true);
			expect(registry.has(eid, Health)).toBe(true);
			expect(Transform[eid]).toEqual({ x: 5, y: 15, rotation: 45 });
			expect(Health[eid]).toBe(100);
		});

		it('should return false for non-existent components', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.createEntity();

			expect(registry.remove(eid, Position)).toBe(false);
		});

		it('should return false for already removed components', () => {
			const Position: TPosition = { x: [], y: [] };
			const eid = entityIndex.createEntity();

			registry.add(eid, Position);
			expect(registry.remove(eid, Position)).toBe(true);
			expect(registry.remove(eid, Position)).toBe(false);
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
				registry.register(component);
			}

			// These will be in generation 1
			registry.register(Position);
			registry.register(Transform);
			registry.register(Health);
			registry.register(Player);

			const eid = entityIndex.createEntity();

			// Add components from both generations
			registry.add(eid, gen0Components[0]!);
			registry.add(eid, Position);
			registry.add(eid, Transform);
			registry.add(eid, Health);
			registry.add(eid, Player);

			// Set data
			Position.x[eid] = 10;
			Position.y[eid] = 20;
			Transform[eid] = { x: 5, y: 15, rotation: 45 };
			Health[eid] = 100;

			// Remove components from different generations
			registry.remove(eid, Position);
			expect(registry.has(eid, Position)).toBe(false);
			expect(Position.x[eid]).toBeUndefined();
			expect(Position.y[eid]).toBeUndefined();

			registry.remove(eid, gen0Components[0]!);
			expect(registry.has(eid, gen0Components[0]!)).toBe(false);

			// Other components should still exist
			expect(registry.has(eid, Transform)).toBe(true);
			expect(registry.has(eid, Health)).toBe(true);
			expect(registry.has(eid, Player)).toBe(true);
		});
	});

	describe('removeAll', () => {
		it('should remove all components from entity', () => {
			const Position: TPosition = { x: [], y: [] };
			const Transform: TTransform = [];
			const Health: THealth = [];
			const Player: TPlayer = {};

			registry.register(Position);
			registry.register(Transform);
			registry.register(Health);
			registry.register(Player);

			const eid = entityIndex.createEntity();

			// Add components and set data
			registry.add(eid, Position);
			registry.add(eid, Transform);
			registry.add(eid, Health);
			registry.add(eid, Player);

			Position.x[eid] = 10;
			Position.y[eid] = 20;
			Transform[eid] = { x: 5, y: 15, rotation: 45 };
			Health[eid] = 100;

			// Remove all components
			registry.removeAll(eid);

			// All components should be removed
			expect(registry.has(eid, Position)).toBe(false);
			expect(registry.has(eid, Transform)).toBe(false);
			expect(registry.has(eid, Health)).toBe(false);
			expect(registry.has(eid, Player)).toBe(false);

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
				registry.register(component);
			}

			registry.register(Position);

			const eid = entityIndex.createEntity();

			registry.add(eid, gen0Components[0]!);
			registry.add(eid, Position);
			Position.x[eid] = 10;

			// Verify data exists
			expect(Position.x[eid]).toBe(10);
			expect(registry.has(eid, Position)).toBe(true);

			// Reset registry
			registry.reset();

			// All arrays should be cleared
			expect(Position.x.length).toBe(0);

			// Registry should be empty
			expect(registry.has(eid, Position)).toBe(false);
		});
	});

	describe('change tracking', () => {
		it('should track component additions', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Initially, component should not be marked as added
			expect(registry.wasAdded(eid, Position)).toBe(false);

			// Add component
			registry.add(eid, Position);

			// Now it should be marked as added
			expect(registry.wasAdded(eid, Position)).toBe(true);
			expect(registry.has(eid, Position)).toBe(true);
		});

		it('should track component removals', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Add component first
			registry.add(eid, Position);
			expect(registry.wasRemoved(eid, Position)).toBe(false);

			// Remove component
			registry.remove(eid, Position);

			// Now it should be marked as removed
			expect(registry.wasRemoved(eid, Position)).toBe(true);
			expect(registry.has(eid, Position)).toBe(false);
		});

		it('should track component changes', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Add component first
			registry.add(eid, Position);
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
			registry.add(eid, Position);
			registry.add(eid, Health);
			registry.markChanged(eid, Position);
			registry.remove(eid, Health);

			// Verify changes are tracked
			expect(registry.wasAdded(eid, Position)).toBe(true);
			expect(registry.wasChanged(eid, Position)).toBe(true);
			expect(registry.wasRemoved(eid, Health)).toBe(true);

			// Clear frame changes
			registry.flush();

			// Changes should be cleared
			expect(registry.wasAdded(eid, Position)).toBe(false);
			expect(registry.wasChanged(eid, Position)).toBe(false);
			expect(registry.wasRemoved(eid, Health)).toBe(false);

			// But component state should remain
			expect(registry.has(eid, Position)).toBe(true);
			expect(registry.has(eid, Health)).toBe(false);
		});

		it('should handle multiple entities and components', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];
			const eid1 = 1;
			const eid2 = 2;

			// Entity 1: Add Position, mark changed
			registry.add(eid1, Position);
			registry.markChanged(eid1, Position);

			// Entity 2: Add Health, remove it
			registry.add(eid2, Health);
			registry.remove(eid2, Health);

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
			components.forEach((comp) => registry.register(comp));

			// Add components from different generations
			registry.add(eid, components[0]); // Generation 0
			registry.add(eid, components[31]); // Generation 1

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

			registry.onAdd(Position, (eid) => {
				positionAddedEntities.push(eid);
			});

			registry.onAdd(Health, (eid) => {
				healthAddedEntities.push(eid);
			});

			// Add components
			registry.add(eid1, Position);
			registry.add(eid1, Health);
			registry.add(eid2, Position);

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
			registry.add(eid1, Position);
			registry.add(eid1, Health);
			registry.add(eid2, Position);

			// Setup callbacks
			const positionChangedEntities: number[] = [];
			const healthChangedEntities: number[] = [];

			registry.onChange(Position, (eid) => {
				positionChangedEntities.push(eid);
			});

			registry.onChange(Health, (eid) => {
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
			registry.add(eid1, Position);
			registry.add(eid1, Health);
			registry.add(eid2, Position);

			// Setup callbacks
			const positionRemovedEntities: number[] = [];
			const healthRemovedEntities: number[] = [];

			registry.onRemove(Position, (eid) => {
				positionRemovedEntities.push(eid);
			});

			registry.onRemove(Health, (eid) => {
				healthRemovedEntities.push(eid);
			});

			// Remove components
			registry.remove(eid1, Position);
			registry.remove(eid1, Health);
			registry.remove(eid2, Position);

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

			registry.onAdd(Position, () => addCallCount++);
			registry.onChange(Position, () => changeCallCount++);
			registry.onRemove(Position, () => removeCallCount++);

			// Try to mark non-existent component as changed
			registry.markChanged(eid, Position);
			expect(changeCallCount).toBe(0);

			// Try to remove non-existent component
			registry.remove(eid, Position);
			expect(removeCallCount).toBe(0);

			// Add component (should trigger callback)
			registry.add(eid, Position);
			expect(addCallCount).toBe(1);

			// Try to add same component again (should not trigger callback)
			registry.add(eid, Position);
			expect(addCallCount).toBe(1);
		});

		it('should handle multiple callbacks for same component', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			// Setup multiple callbacks
			const callback1Calls: number[] = [];
			const callback2Calls: number[] = [];

			registry.onAdd(Position, (eid) => callback1Calls.push(eid));
			registry.onAdd(Position, (eid) => callback2Calls.push(eid));

			// Add component
			registry.add(eid, Position);

			// Both callbacks should be called
			expect(callback1Calls).toEqual([eid]);
			expect(callback2Calls).toEqual([eid]);
		});

		it('should support unregister functions', () => {
			const Position = { x: [] as number[], y: [] as number[] };
			const eid = 1;

			const callbackResults: string[] = [];

			// Register multiple callbacks
			const unregister1 = registry.onAdd(Position, () => {
				callbackResults.push('callback1');
			});

			const unregister2 = registry.onAdd(Position, () => {
				callbackResults.push('callback2');
			});

			const unregister3 = registry.onAdd(Position, () => {
				callbackResults.push('callback3');
			});

			// Add component - all callbacks should fire
			registry.add(eid, Position);
			expect(callbackResults).toEqual(['callback1', 'callback2', 'callback3']);

			// Unregister middle callback
			unregister2();

			// Reset and test again
			callbackResults.length = 0;
			registry.remove(eid, Position);
			registry.add(eid, Position);

			// Only callback1 and callback3 should fire
			expect(callbackResults).toEqual(['callback1', 'callback3']);

			// Unregister all remaining
			unregister1();
			unregister3();

			// Reset and test again
			callbackResults.length = 0;
			registry.remove(eid, Position);
			registry.add(eid, Position);

			// No callbacks should fire
			expect(callbackResults).toEqual([]);
		});
	});
});

// Array of objects components (AoS)
type TTransform = { x: number; y: number; rotation: number }[];
type TRenderInfo = { sprite: string; layer: number; visible: boolean }[];

// Object with array properties components (SoA)
type TPosition = { x: number[]; y: number[] };
type TVelocity = { dx: number[]; dy: number[] };

// Single value array components
type THealth = number[];
type TMana = number[];
type TLevel = number[];

// Marker components
type TPlayer = {};
type TEnemy = {};
type TFrozen = {};
