import { bench, describe, expect } from 'vitest';
import { And, createApp, With, Without } from '../../src';
import { createSeededRandom } from '../utils';

describe('Query Performance', () => {
	const seed = Math.random() * 1000000;
	const random = createSeededRandom(seed);
	const app = createApp();

	// Component definitions
	const Position = { x: [] as number[], y: [] as number[] };
	const Velocity = { x: [] as number[], y: [] as number[] };
	const Health: number[] = [];

	// Create 2000 test entities with deterministic distribution
	for (let i = 0; i < 2000; i++) {
		const eid = app.createEntity();

		if (random.nextBool(0.8)) {
			app.addComponent(eid, Position);
			Position.x[eid] = random.next() * 1000;
			Position.y[eid] = random.next() * 1000;
		}

		if (random.nextBool(0.6)) {
			app.addComponent(eid, Velocity);
			Velocity.x[eid] = (random.next() - 0.5) * 10;
			Velocity.y[eid] = (random.next() - 0.5) * 10;
		}

		if (random.nextBool(0.7)) {
			app.addComponent(eid, Health);
			Health[eid] = Math.floor(random.next() * 100) + 1;
		}
	}

	describe('With(Position)', () => {
		bench('bitmask + cached', () => {
			const entities = app.queryEntities(With(Position), {
				evaluationStrategy: 'bitmask',
				cache: true
			});
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('bitmask + no cache', () => {
			const entities = app.queryEntities(With(Position), {
				evaluationStrategy: 'bitmask',
				cache: false
			});
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('individual + cached', () => {
			const entities = app.queryEntities(With(Position), {
				evaluationStrategy: 'individual',
				cache: true
			});
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('individual + no cache', () => {
			const entities = app.queryEntities(With(Position), {
				evaluationStrategy: 'individual',
				cache: false
			});
			expect(entities.length).toBeGreaterThan(0);
		});
	});

	describe('And(With(Position), With(Velocity))', () => {
		bench('bitmask + cached', () => {
			const entities = app.queryEntities(And(With(Position), With(Velocity)), {
				evaluationStrategy: 'bitmask',
				cache: true
			});
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('bitmask + no cache', () => {
			const entities = app.queryEntities(And(With(Position), With(Velocity)), {
				evaluationStrategy: 'bitmask',
				cache: false
			});
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('individual + cached', () => {
			const entities = app.queryEntities(And(With(Position), With(Velocity)), {
				evaluationStrategy: 'individual',
				cache: true
			});
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('individual + no cache', () => {
			const entities = app.queryEntities(And(With(Position), With(Velocity)), {
				evaluationStrategy: 'individual',
				cache: false
			});
			expect(entities.length).toBeGreaterThan(0);
		});
	});

	describe('And(With(Position), Without(Health))', () => {
		bench('bitmask + cached', () => {
			const entities = app.queryEntities(And(With(Position), Without(Health)), {
				evaluationStrategy: 'bitmask',
				cache: true
			});
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});

		bench('bitmask + no cache', () => {
			const entities = app.queryEntities(And(With(Position), Without(Health)), {
				evaluationStrategy: 'bitmask',
				cache: false
			});
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});

		bench('individual + cached', () => {
			const entities = app.queryEntities(And(With(Position), Without(Health)), {
				evaluationStrategy: 'individual',
				cache: true
			});
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});

		bench('individual + no cache', () => {
			const entities = app.queryEntities(And(With(Position), Without(Health)), {
				evaluationStrategy: 'individual',
				cache: false
			});
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});
	});
});
