import { bench, describe, expect } from 'vitest';
import { createApp, With } from '../../src';
import { createSeededRandom } from '../create-seeded-random';

describe('Component Variants Performance', () => {
	const seed = Math.random() * 1000000;
	const random = createSeededRandom(seed);

	// Different component patterns
	const Transform: { x: number; y: number }[] = []; // Array of objects (AoS)
	const Position: { x: number[]; y: number[] } = { x: [], y: [] }; // Object with array properties (SoA)
	const Health: number[] = []; // Single value array
	const Player: {} = {}; // Marker component

	describe('Add Component', () => {
		bench('AoS - Transform', () => {
			const app = createApp({ plugins: [], systemSets: [] });
			const eid = app.createEntity();

			app.addComponent(eid, Transform);
			Transform[eid] = { x: random.next() * 1000, y: random.next() * 1000 };

			expect(app.hasComponent(eid, Transform)).toBe(true);
		});

		bench('SoA - Position', () => {
			const app = createApp({ plugins: [], systemSets: [] });
			const eid = app.createEntity();

			app.addComponent(eid, Position);
			Position.x[eid] = random.next() * 1000;
			Position.y[eid] = random.next() * 1000;

			expect(app.hasComponent(eid, Position)).toBe(true);
		});

		bench('Single Array - Health', () => {
			const app = createApp({ plugins: [], systemSets: [] });
			const eid = app.createEntity();

			app.addComponent(eid, Health);
			Health[eid] = Math.floor(random.next() * 100) + 1;

			expect(app.hasComponent(eid, Health)).toBe(true);
		});

		bench('Marker - Player', () => {
			const app = createApp({ plugins: [], systemSets: [] });
			const eid = app.createEntity();

			app.addComponent(eid, Player);

			expect(app.hasComponent(eid, Player)).toBe(true);
		});
	});

	describe('Remove Component', () => {
		bench('AoS - Transform', () => {
			const app = createApp({ plugins: [], systemSets: [] });
			const eid = app.createEntity();
			app.addComponent(eid, Transform);
			Transform[eid] = { x: 100, y: 200 };

			const removed = app.removeComponent(eid, Transform);
			expect(removed).toBe(true);
		});

		bench('SoA - Position', () => {
			const app = createApp({ plugins: [], systemSets: [] });
			const eid = app.createEntity();
			app.addComponent(eid, Position);
			Position.x[eid] = 100;
			Position.y[eid] = 200;

			const removed = app.removeComponent(eid, Position);
			expect(removed).toBe(true);
		});

		bench('Single Array - Health', () => {
			const app = createApp({ plugins: [], systemSets: [] });
			const eid = app.createEntity();
			app.addComponent(eid, Health);
			Health[eid] = 100;

			const removed = app.removeComponent(eid, Health);
			expect(removed).toBe(true);
		});

		bench('Marker - Player', () => {
			const app = createApp({ plugins: [], systemSets: [] });
			const eid = app.createEntity();
			app.addComponent(eid, Player);

			const removed = app.removeComponent(eid, Player);
			expect(removed).toBe(true);
		});
	});

	describe('Query Component', () => {
		const appAoS = createApp({ plugins: [], systemSets: [] });
		const appSoA = createApp({ plugins: [], systemSets: [] });
		const appSingle = createApp({ plugins: [], systemSets: [] });
		const appMarker = createApp({ plugins: [], systemSets: [] });

		// AoS setup
		for (let i = 0; i < 500; i++) {
			const eid = appAoS.createEntity();
			if (random.nextBool(0.7)) {
				appAoS.addComponent(eid, Transform);
				Transform[eid] = { x: random.next() * 1000, y: random.next() * 1000 };
			}
		}

		// SoA setup
		for (let i = 0; i < 500; i++) {
			const eid = appSoA.createEntity();
			if (random.nextBool(0.7)) {
				appSoA.addComponent(eid, Position);
				Position.x[eid] = random.next() * 1000;
				Position.y[eid] = random.next() * 1000;
			}
		}

		// Single array setup
		for (let i = 0; i < 500; i++) {
			const eid = appSingle.createEntity();
			if (random.nextBool(0.7)) {
				appSingle.addComponent(eid, Health);
				Health[eid] = Math.floor(random.next() * 100) + 1;
			}
		}

		// Marker setup
		for (let i = 0; i < 500; i++) {
			const eid = appMarker.createEntity();
			if (random.nextBool(0.7)) {
				appMarker.addComponent(eid, Player);
			}
		}

		bench('AoS - Transform', () => {
			const entities = appAoS.queryEntities(With(Transform));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('SoA - Position', () => {
			const entities = appSoA.queryEntities(With(Position));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('Single Array - Health', () => {
			const entities = appSingle.queryEntities(With(Health));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('Marker - Player', () => {
			const entities = appMarker.queryEntities(With(Player));
			expect(entities.length).toBeGreaterThan(0);
		});
	});
});
