import { beforeEach, describe, expect, it } from 'vitest';
import { createEntityIndex, TEntityIndex } from '../entity';
import { createComponentRegistry, TComponentRegistry } from './create-component-registry';
import { validateComponentRegistry } from './validate-component-registry';

describe('validateComponentRegistry', () => {
	let registry: TComponentRegistry;
	let entityIndex: TEntityIndex;

	beforeEach(() => {
		registry = createComponentRegistry();
		entityIndex = createEntityIndex();
	});

	it('should return true for valid empty registry', () => {
		expect(validateComponentRegistry(registry)).toBe(true);
	});

	it('should return true for valid registry with components', () => {
		const Position: TPosition = { x: [], y: [] };
		const Health: THealth = [];

		registry.registerComponent(Position);
		registry.registerComponent(Health);

		expect(validateComponentRegistry(registry)).toBe(true);
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

		expect(validateComponentRegistry(registry)).toBe(true);

		registry.removeComponent(eid1, Health);
		expect(validateComponentRegistry(registry)).toBe(true);

		registry.removeAllComponents(eid2);
		expect(validateComponentRegistry(registry)).toBe(true);
	});

	it('should return true with generation system', () => {
		// Register 35 components to test generation overflow
		const components = [];
		for (let i = 0; i < 35; i++) {
			const component = {};
			components.push(component);
			registry.registerComponent(component);
		}

		expect(validateComponentRegistry(registry)).toBe(true);

		const eid = entityIndex.addEntity();
		registry.addComponent(eid, components[0]!); // Gen 0
		registry.addComponent(eid, components[31]!); // Gen 1

		expect(validateComponentRegistry(registry)).toBe(true);
	});

	it('should return true after reset', () => {
		const Position: TPosition = { x: [], y: [] };
		registry.registerComponent(Position);

		const eid = entityIndex.addEntity();
		registry.addComponent(eid, Position);

		registry.reset();

		expect(validateComponentRegistry(registry)).toBe(true);
	});
});

type TPosition = { x: number[]; y: number[] };
type THealth = number[];
