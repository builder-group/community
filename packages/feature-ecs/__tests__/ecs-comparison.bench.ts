import {
	addComponent as bitECSAddComponent,
	addEntity as bitECSAddEntity,
	query as bitECSQuery,
	createWorld as createBitEcsWorld
} from 'bitecs';
import { bench, describe, expect } from 'vitest';
import { And, createWorld, With } from '../src';
import { createSeededRandom } from './utils';

describe('ECS Performance Comparison', () => {
	const seed = Math.random() * 1000000;

	// FeatureEcs setup
	const featureEcsRandom = createSeededRandom(seed);
	const featureEcsWorld = createWorld();
	const FeatureEcsPosition = { x: [] as number[], y: [] as number[] };
	const FeatureEcsVelocity = { x: [] as number[], y: [] as number[] };
	const FeatureEcsHealth: number[] = [];

	// BitEcs setup
	const bitEcsRandom = createSeededRandom(seed);
	const bitECSWorld = createBitEcsWorld();
	const BitEcsPosition = { x: [] as number[], y: [] as number[] };
	const BitEcsVelocity = { x: [] as number[], y: [] as number[] };
	const BitEcsHealth = [] as number[];

	describe('Entity Creation', () => {
		bench('FeatureEcs - Create entity', () => {
			const eid = featureEcsWorld.createEntity();
			expect(eid).toBeGreaterThanOrEqual(0);
		});

		bench('BitEcs - Create entity', () => {
			const eid = bitECSAddEntity(bitECSWorld);
			expect(eid).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Component Addition', () => {
		bench('FeatureEcs - Add Position component', () => {
			const eid = featureEcsWorld.createEntity();
			featureEcsWorld.addComponent(eid, FeatureEcsPosition);
			FeatureEcsPosition.x[eid] = 100;
			FeatureEcsPosition.y[eid] = 200;
		});

		bench('BitEcs - Add Position component', () => {
			const eid = bitECSAddEntity(bitECSWorld);
			bitECSAddComponent(bitECSWorld, eid, BitEcsPosition);
			BitEcsPosition.x[eid] = 100;
			BitEcsPosition.y[eid] = 200;
		});
	});

	describe('Component Queries', () => {
		for (let i = 0; i < 1000; i++) {
			// FeatureEcs entities
			const featureEcsEid = featureEcsWorld.createEntity();
			if (featureEcsRandom.nextBool(0.7)) {
				featureEcsWorld.addComponent(featureEcsEid, FeatureEcsPosition);
				FeatureEcsPosition.x[featureEcsEid] = i;
				FeatureEcsPosition.y[featureEcsEid] = i * 2;
			}
			if (featureEcsRandom.nextBool(0.5)) {
				featureEcsWorld.addComponent(featureEcsEid, FeatureEcsVelocity);
				FeatureEcsVelocity.x[featureEcsEid] = 1.5;
				FeatureEcsVelocity.y[featureEcsEid] = 2.0;
			}
			if (featureEcsRandom.nextBool(0.3)) {
				featureEcsWorld.addComponent(featureEcsEid, FeatureEcsHealth);
				FeatureEcsHealth[featureEcsEid] = 100;
			}

			// BitEcs entities
			const bitEcsEid = bitECSAddEntity(bitECSWorld);
			if (bitEcsRandom.nextBool(0.7)) {
				bitECSAddComponent(bitECSWorld, bitEcsEid, BitEcsPosition);
				BitEcsPosition.x[bitEcsEid] = i;
				BitEcsPosition.y[bitEcsEid] = i * 2;
			}
			if (bitEcsRandom.nextBool(0.5)) {
				bitECSAddComponent(bitECSWorld, bitEcsEid, BitEcsVelocity);
				BitEcsVelocity.x[bitEcsEid] = 1.5;
				BitEcsVelocity.y[bitEcsEid] = 2.0;
			}
			if (bitEcsRandom.nextBool(0.3)) {
				bitECSAddComponent(bitECSWorld, bitEcsEid, BitEcsHealth);
				BitEcsHealth[bitEcsEid] = 100;
			}
		}

		bench('FeatureEcs - Query Position components', () => {
			const entities = featureEcsWorld.query(With(FeatureEcsPosition));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('BitEcs - Query Position components', () => {
			const entities = Array.from(bitECSQuery(bitECSWorld, [BitEcsPosition]));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('FeatureEcs - Query Position + Velocity', () => {
			const entities = featureEcsWorld.query(
				And(With(FeatureEcsPosition), With(FeatureEcsVelocity))
			);
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});

		bench('BitEcs - Query Position + Velocity', () => {
			const entities = bitECSQuery(bitECSWorld, [BitEcsPosition, BitEcsVelocity]);
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('System Iteration Performance', () => {
		for (let i = 0; i < 5000; i++) {
			const posX = featureEcsRandom.next() * 1000;
			const posY = featureEcsRandom.next() * 1000;
			const velX = (featureEcsRandom.next() - 0.5) * 10;
			const velY = (featureEcsRandom.next() - 0.5) * 10;

			// FeatureEcs
			const featureEcsEid = featureEcsWorld.createEntity();
			featureEcsWorld.addComponent(featureEcsEid, FeatureEcsPosition);
			featureEcsWorld.addComponent(featureEcsEid, FeatureEcsVelocity);
			FeatureEcsPosition.x[featureEcsEid] = posX;
			FeatureEcsPosition.y[featureEcsEid] = posY;
			FeatureEcsVelocity.x[featureEcsEid] = velX;
			FeatureEcsVelocity.y[featureEcsEid] = velY;

			// BitEcs
			const bitEcsEid = bitECSAddEntity(bitECSWorld);
			bitECSAddComponent(bitECSWorld, bitEcsEid, BitEcsPosition);
			bitECSAddComponent(bitECSWorld, bitEcsEid, BitEcsVelocity);
			BitEcsPosition.x[bitEcsEid] = posX;
			BitEcsPosition.y[bitEcsEid] = posY;
			BitEcsVelocity.x[bitEcsEid] = velX;
			BitEcsVelocity.y[bitEcsEid] = velY;
		}

		bench('FeatureEcs - Movement system iteration', () => {
			let updateCount = 0;

			for (const eid of featureEcsWorld.query(
				And(With(FeatureEcsPosition), With(FeatureEcsVelocity))
			)) {
				const velX = FeatureEcsVelocity.x[eid] ?? 0;
				const velY = FeatureEcsVelocity.y[eid] ?? 0;
				FeatureEcsPosition.x[eid] = (FeatureEcsPosition.x[eid] ?? 0) + velX * 0.016; // 60fps delta
				FeatureEcsPosition.y[eid] = (FeatureEcsPosition.y[eid] ?? 0) + velY * 0.016;
				updateCount++;
			}

			expect(updateCount).toBeGreaterThan(0);
		});

		bench('BitEcs - Movement system iteration', () => {
			let updateCount = 0;

			for (const eid of bitECSQuery(bitECSWorld, [BitEcsPosition, BitEcsVelocity])) {
				const velX = BitEcsVelocity.x[eid] ?? 0;
				const velY = BitEcsVelocity.y[eid] ?? 0;
				BitEcsPosition.x[eid] = (BitEcsPosition.x[eid] ?? 0) + velX * 0.016; // 60fps delta
				BitEcsPosition.y[eid] = (BitEcsPosition.y[eid] ?? 0) + velY * 0.016;
				updateCount++;
			}

			expect(updateCount).toBeGreaterThan(0);
		});
	});
});
