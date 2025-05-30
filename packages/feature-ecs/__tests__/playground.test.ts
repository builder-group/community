import { describe, expect, it } from 'vitest';
import { createWorld, With } from '../src';
import { createSeededRandom } from './utils';

describe('playground', () => {
	it('should pass', () => {
		expect(true).toBe(true);
	});

	it.skip('should work', () => {
		const seed = Math.random() * 1000000;
		const random = createSeededRandom(seed);
		const world = createWorld();

		// Component definitions
		const Position = { x: [] as number[], y: [] as number[] };
		const Velocity = { x: [] as number[], y: [] as number[] };
		const Health: number[] = [];

		// Create 2000 test entities with deterministic distribution
		for (let i = 0; i < 2000; i++) {
			const eid = world.createEntity();

			if (random.nextBool(0.8)) {
				world.addComponent(eid, Position);
				Position.x[eid] = random.next() * 1000;
				Position.y[eid] = random.next() * 1000;
			}

			if (random.nextBool(0.6)) {
				world.addComponent(eid, Velocity);
				Velocity.x[eid] = (random.next() - 0.5) * 10;
				Velocity.y[eid] = (random.next() - 0.5) * 10;
			}

			if (random.nextBool(0.7)) {
				world.addComponent(eid, Health);
				Health[eid] = Math.floor(random.next() * 100) + 1;
			}
		}

		const entities = world.query(With(Position), {
			evaluationStrategy: 'bitmask',
			cache: true
		});
		expect(entities.length).toBeGreaterThan(0);
	});
});
