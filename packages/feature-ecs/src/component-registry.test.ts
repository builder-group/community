import { beforeEach, describe, expect, test } from 'vitest';
import { createComponentRegistry, TComponentRegistry } from './component-registry';
import { createEntityIndex, TEntityIndex } from './entity-index';

describe('createComponentRegistry', () => {
	let registry: TComponentRegistry;
	let entityIndex: TEntityIndex;

	beforeEach(() => {
		registry = createComponentRegistry();
		entityIndex = createEntityIndex();
	});

	test('component registration and metadata', () => {
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

	test('object with array properties pattern', () => {
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

	test('array of objects pattern', () => {
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

	test('single value array pattern', () => {
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

	test('tag component pattern', () => {
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

	test('unlimited components with generation system', () => {
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

		const eid = entityIndex.addEntity();

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

		// Check entity masks across generations
		const masks = registry.getEntityComponentMask(eid);
		expect(masks).toHaveLength(2);
		expect(masks[0]).toBe(1 + 2 ** 30); // Gen 0: component 0 + component 30
		expect(masks[1]).toBe(1 + 8); // Gen 1: component 31 + component 34
	});

	test('mixed component patterns in queries across generations', () => {
		const Position: TPosition = { x: [], y: [] };
		const Transform: TTransform = [];
		const Health: THealth = [];
		const Player: TPlayer = {};

		// Register many components to force generation overflow
		const extraComponents = [];
		for (let i = 0; i < 30; i++) {
			const component = {};
			extraComponents.push(component);
			registry.registerComponent(component);
		}

		// These will be in generation 1
		registry.registerComponent(Position);
		registry.registerComponent(Transform);
		registry.registerComponent(Health);
		registry.registerComponent(Player);

		const eid1 = entityIndex.addEntity();
		const eid2 = entityIndex.addEntity();
		const eid3 = entityIndex.addEntity();

		// eid1: Position + Health + Player (all in generation 1)
		registry.addComponent(eid1, Position);
		registry.addComponent(eid1, Health);
		registry.addComponent(eid1, Player);
		Position.x[eid1] = 10;
		Position.y[eid1] = 20;
		Health[eid1] = 100;

		// eid2: Transform + Health + some gen 0 components
		registry.addComponent(eid2, Transform);
		registry.addComponent(eid2, Health);
		registry.addComponent(eid2, extraComponents[0]!); // Gen 0
		registry.addComponent(eid2, extraComponents[1]!); // Gen 0
		Transform[eid2] = { x: 5, y: 15, rotation: 0 };
		Health[eid2] = 80;

		// eid3: Position + Transform + Player + gen 0 components
		registry.addComponent(eid3, Position);
		registry.addComponent(eid3, Transform);
		registry.addComponent(eid3, Player);
		registry.addComponent(eid3, extraComponents[5]!); // Gen 0
		Position.x[eid3] = 50;
		Position.y[eid3] = 60;
		Transform[eid3] = { x: 25, y: 35, rotation: 90 };

		// Query tests across generations
		const playersWithHealth = registry.getEntitiesWithComponents([Player, Health]);
		expect(playersWithHealth).toHaveLength(1);
		expect(playersWithHealth).toContain(eid1);

		const entitiesWithTransform = registry.getEntitiesWithComponent(Transform);
		expect(entitiesWithTransform).toHaveLength(2);
		expect(entitiesWithTransform).toContain(eid2);
		expect(entitiesWithTransform).toContain(eid3);

		const playersWithPosition = registry.getEntitiesWithComponents([Player, Position]);
		expect(playersWithPosition).toHaveLength(2);
		expect(playersWithPosition).toContain(eid1);
		expect(playersWithPosition).toContain(eid3);

		// Cross-generation query
		const crossGenQuery = registry.getEntitiesWithComponents([extraComponents[0]!, Health]);
		expect(crossGenQuery).toHaveLength(1);
		expect(crossGenQuery).toContain(eid2);
	});

	test('component removal across all patterns and generations', () => {
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

		// Verify all components exist
		expect(registry.hasComponent(eid, gen0Components[0]!)).toBe(true);
		expect(registry.hasComponent(eid, Position)).toBe(true);
		expect(registry.hasComponent(eid, Transform)).toBe(true);
		expect(registry.hasComponent(eid, Health)).toBe(true);
		expect(registry.hasComponent(eid, Player)).toBe(true);

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

		// Remove all remaining components
		registry.removeAllComponents(eid);
		expect(registry.hasComponent(eid, Transform)).toBe(false);
		expect(registry.hasComponent(eid, Health)).toBe(false);
		expect(registry.hasComponent(eid, Player)).toBe(false);
	});

	test('component masks with generation system', () => {
		const Position: TPosition = { x: [], y: [] };
		const Transform: TTransform = [];

		// Add 31 components to fill first generation
		const gen0Components = [];
		for (let i = 0; i < 31; i++) {
			const component = {};
			gen0Components.push(component);
			registry.registerComponent(component);
		}

		// These will be in generation 1
		registry.registerComponent(Position); // Gen 1, bitflag: 1
		registry.registerComponent(Transform); // Gen 1, bitflag: 2

		const eid = entityIndex.addEntity();

		let masks = registry.getEntityComponentMask(eid);
		expect(masks).toEqual([0, 0]); // No components

		registry.addComponent(eid, gen0Components[0]!); // Gen 0, bitflag 1
		masks = registry.getEntityComponentMask(eid);
		expect(masks).toEqual([1, 0]);

		registry.addComponent(eid, Position); // Gen 1, bitflag 1
		masks = registry.getEntityComponentMask(eid);
		expect(masks).toEqual([1, 1]);

		registry.addComponent(eid, gen0Components[30]!); // Gen 0, bitflag 2^30
		masks = registry.getEntityComponentMask(eid);
		expect(masks).toEqual([1 + 2 ** 30, 1]);

		registry.addComponent(eid, Transform); // Gen 1, bitflag 2
		masks = registry.getEntityComponentMask(eid);
		expect(masks).toEqual([1 + 2 ** 30, 1 + 2]);
	});

	test('debug state with generations', () => {
		const Position: TPosition = { x: [], y: [] };

		// Add components to create multiple generations
		const gen0Components = [];
		for (let i = 0; i < 31; i++) {
			const component = {};
			gen0Components.push(component);
			registry.registerComponent(component);
		}

		registry.registerComponent(Position);

		const eid1 = entityIndex.addEntity();
		const eid2 = entityIndex.addEntity();

		registry.addComponent(eid1, gen0Components[0]!);
		registry.addComponent(eid1, Position);
		registry.addComponent(eid2, gen0Components[1]!);

		const debugState = registry.debugState();
		expect(debugState).toContain('ComponentRegistry State:');
		expect(debugState).toContain('Components (32):');
		expect(debugState).toContain('Generations: 2');
		expect(debugState).toContain('Gen0:');
		expect(debugState).toContain('Gen1:');
	});

	test('performance with generation system', () => {
		// Register components across multiple generations
		const components = [];
		for (let i = 0; i < 65; i++) {
			// 2+ generations
			const component = {};
			components.push(component);
			registry.registerComponent(component);
		}

		// Create many entities with mixed generation components
		const entities = [];
		for (let i = 0; i < 1000; i++) {
			const eid = entityIndex.addEntity();
			entities.push(eid);

			// Add components from different generations
			registry.addComponent(eid, components[i % 31]!); // Gen 0
			registry.addComponent(eid, components[31 + (i % 31)]!); // Gen 1
			if (i % 3 === 0) {
				registry.addComponent(eid, components[62]!); // Gen 2
			}
		}

		// Fast component checks across generations
		const start = performance.now();
		for (let i = 0; i < 10000; i++) {
			const eid = entities[i % entities.length]!;
			registry.hasComponent(eid, components[0]!);
			registry.hasComponent(eid, components[31]!);
			registry.hasComponent(eid, components[62]!);
		}
		const end = performance.now();

		// Should be very fast even with generations
		expect(end - start).toBeLessThan(30);

		// Cross-generation query performance
		const start2 = performance.now();
		const crossGenEntities = registry.getEntitiesWithComponents([
			components[0]!, // Gen 0
			components[31]!, // Gen 1
			components[62]! // Gen 2
		]);
		const end2 = performance.now();

		expect(end2 - start2).toBeLessThan(20);
		expect(crossGenEntities.length).toBeGreaterThan(0);
	});

	test('reset functionality with generations', () => {
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

		// Registry should be empty with one generation
		expect(registry.getAllComponents()).toHaveLength(0);
		expect(registry.hasComponent(eid, Position)).toBe(false);

		// Should start with one generation again
		const masks = registry.getEntityComponentMask(eid);
		expect(masks).toEqual([0]);
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
