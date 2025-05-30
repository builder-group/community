import { bench, describe, expect } from 'vitest';
import { createWorld, With } from '../src';
import { createSeededRandom } from './utils';

describe('Component Variants Performance', () => {
	const seed = Math.random() * 1000000;
	const random = createSeededRandom(seed);

	// Different component patterns
	const Position: { x: number[]; y: number[] } = { x: [], y: [] }; // Object with arrays (AoS)
	const Transform: { x: number; y: number }[] = []; // Array of objects (SoA)
	const Health: number[] = []; // Single value array
	const Player: {} = {}; // Tag component

	describe('Add Component', () => {
		bench('AoS - Position', () => {
			const world = createWorld();
			const eid = world.createEntity();

			world.addComponent(eid, Position);
			Position.x[eid] = random.next() * 1000;
			Position.y[eid] = random.next() * 1000;

			expect(world.hasComponent(eid, Position)).toBe(true);
		});

		bench('SoA - Transform', () => {
			const world = createWorld();
			const eid = world.createEntity();

			world.addComponent(eid, Transform);
			Transform[eid] = { x: random.next() * 1000, y: random.next() * 1000 };

			expect(world.hasComponent(eid, Transform)).toBe(true);
		});

		bench('Single Array - Health', () => {
			const world = createWorld();
			const eid = world.createEntity();

			world.addComponent(eid, Health);
			Health[eid] = Math.floor(random.next() * 100) + 1;

			expect(world.hasComponent(eid, Health)).toBe(true);
		});

		bench('Tag - Player', () => {
			const world = createWorld();
			const eid = world.createEntity();

			world.addComponent(eid, Player);

			expect(world.hasComponent(eid, Player)).toBe(true);
		});
	});

	describe('Remove Component', () => {
		bench('AoS - Position', () => {
			const world = createWorld();
			const eid = world.createEntity();
			world.addComponent(eid, Position);
			Position.x[eid] = 100;
			Position.y[eid] = 200;

			const removed = world.removeComponent(eid, Position);
			expect(removed).toBe(true);
		});

		bench('SoA - Transform', () => {
			const world = createWorld();
			const eid = world.createEntity();
			world.addComponent(eid, Transform);
			Transform[eid] = { x: 100, y: 200 };

			const removed = world.removeComponent(eid, Transform);
			expect(removed).toBe(true);
		});

		bench('Single Array - Health', () => {
			const world = createWorld();
			const eid = world.createEntity();
			world.addComponent(eid, Health);
			Health[eid] = 100;

			const removed = world.removeComponent(eid, Health);
			expect(removed).toBe(true);
		});

		bench('Tag - Player', () => {
			const world = createWorld();
			const eid = world.createEntity();
			world.addComponent(eid, Player);

			const removed = world.removeComponent(eid, Player);
			expect(removed).toBe(true);
		});
	});

	describe('Query Component', () => {
		const worldAoS = createWorld();
		const worldSoA = createWorld();
		const worldSingle = createWorld();
		const worldTag = createWorld();

		// AoS setup
		for (let i = 0; i < 500; i++) {
			const eid = worldAoS.createEntity();
			if (random.nextBool(0.7)) {
				worldAoS.addComponent(eid, Position);
				Position.x[eid] = random.next() * 1000;
				Position.y[eid] = random.next() * 1000;
			}
		}

		// SoA setup
		for (let i = 0; i < 500; i++) {
			const eid = worldSoA.createEntity();
			if (random.nextBool(0.7)) {
				worldSoA.addComponent(eid, Transform);
				Transform[eid] = { x: random.next() * 1000, y: random.next() * 1000 };
			}
		}

		// Single array setup
		for (let i = 0; i < 500; i++) {
			const eid = worldSingle.createEntity();
			if (random.nextBool(0.7)) {
				worldSingle.addComponent(eid, Health);
				Health[eid] = Math.floor(random.next() * 100) + 1;
			}
		}

		// Tag setup
		for (let i = 0; i < 500; i++) {
			const eid = worldTag.createEntity();
			if (random.nextBool(0.7)) {
				worldTag.addComponent(eid, Player);
			}
		}

		bench('AoS - Position', () => {
			const entities = worldAoS.queryEntities(With(Position));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('SoA - Transform', () => {
			const entities = worldSoA.queryEntities(With(Transform));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('Single Array - Health', () => {
			const entities = worldSingle.queryEntities(With(Health));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('Tag - Player', () => {
			const entities = worldTag.queryEntities(With(Player));
			expect(entities.length).toBeGreaterThan(0);
		});
	});
});
