import {
	addComponent as bitECSAddComponent,
	addEntity as bitECSAddEntity,
	query as bitECSQuery,
	createWorld as createBitEcsWorld
} from 'bitecs';
import { bench, describe, expect } from 'vitest';
import { And, createApp, With } from '../../src';
import { createSeededRandom } from '../utils';

describe('ECS Performance Comparison', () => {
	const seed = Math.random() * 1000000;

	// Ecsify setup
	const ecsifyRandom = createSeededRandom(seed);
	const ecsifyApp = createApp();
	const EcsifyPosition = { x: [] as number[], y: [] as number[] };
	const EcsifyVelocity = { x: [] as number[], y: [] as number[] };
	const EcsifyHealth: number[] = [];

	// BitEcs setup
	const bitEcsRandom = createSeededRandom(seed);
	const bitECSWorld = createBitEcsWorld();
	const BitEcsPosition = { x: [] as number[], y: [] as number[] };
	const BitEcsVelocity = { x: [] as number[], y: [] as number[] };
	const BitEcsHealth = [] as number[];

	describe('Entity Creation', () => {
		bench('Ecsify - Create entity', () => {
			const eid = ecsifyApp.createEntity();
			expect(eid).toBeGreaterThanOrEqual(0);
		});

		bench('BitEcs - Create entity', () => {
			const eid = bitECSAddEntity(bitECSWorld);
			expect(eid).toBeGreaterThanOrEqual(0);
		});
	});

	describe('Component Addition', () => {
		bench('Ecsify - Add Position component', () => {
			const eid = ecsifyApp.createEntity();
			ecsifyApp.addComponent(eid, EcsifyPosition);
			EcsifyPosition.x[eid] = 100;
			EcsifyPosition.y[eid] = 200;
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
			// Ecsify entities
			const ecsifyEid = ecsifyApp.createEntity();
			if (ecsifyRandom.nextBool(0.7)) {
				ecsifyApp.addComponent(ecsifyEid, EcsifyPosition);
				EcsifyPosition.x[ecsifyEid] = i;
				EcsifyPosition.y[ecsifyEid] = i * 2;
			}
			if (ecsifyRandom.nextBool(0.5)) {
				ecsifyApp.addComponent(ecsifyEid, EcsifyVelocity);
				EcsifyVelocity.x[ecsifyEid] = 1.5;
				EcsifyVelocity.y[ecsifyEid] = 2.0;
			}
			if (ecsifyRandom.nextBool(0.3)) {
				ecsifyApp.addComponent(ecsifyEid, EcsifyHealth);
				EcsifyHealth[ecsifyEid] = 100;
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

		bench('Ecsify - Query Position components', () => {
			const entities = ecsifyApp.queryEntities(With(EcsifyPosition));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('BitEcs - Query Position components', () => {
			const entities = Array.from(bitECSQuery(bitECSWorld, [BitEcsPosition]));
			expect(entities.length).toBeGreaterThan(0);
		});

		bench('Ecsify - Query Position + Velocity', () => {
			const entities = ecsifyApp.queryEntities(And(With(EcsifyPosition), With(EcsifyVelocity)));
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});

		bench('BitEcs - Query Position + Velocity', () => {
			const entities = bitECSQuery(bitECSWorld, [BitEcsPosition, BitEcsVelocity]);
			expect(entities.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe('System Iteration Performance', () => {
		for (let i = 0; i < 5000; i++) {
			const posX = ecsifyRandom.next() * 1000;
			const posY = ecsifyRandom.next() * 1000;
			const velX = (ecsifyRandom.next() - 0.5) * 10;
			const velY = (ecsifyRandom.next() - 0.5) * 10;

			// Ecsify
			const ecsifyEid = ecsifyApp.createEntity();
			ecsifyApp.addComponent(ecsifyEid, EcsifyPosition);
			ecsifyApp.addComponent(ecsifyEid, EcsifyVelocity);
			EcsifyPosition.x[ecsifyEid] = posX;
			EcsifyPosition.y[ecsifyEid] = posY;
			EcsifyVelocity.x[ecsifyEid] = velX;
			EcsifyVelocity.y[ecsifyEid] = velY;

			// BitEcs
			const bitEcsEid = bitECSAddEntity(bitECSWorld);
			bitECSAddComponent(bitECSWorld, bitEcsEid, BitEcsPosition);
			bitECSAddComponent(bitECSWorld, bitEcsEid, BitEcsVelocity);
			BitEcsPosition.x[bitEcsEid] = posX;
			BitEcsPosition.y[bitEcsEid] = posY;
			BitEcsVelocity.x[bitEcsEid] = velX;
			BitEcsVelocity.y[bitEcsEid] = velY;
		}

		bench('Ecsify - Movement system iteration', () => {
			let updateCount = 0;

			for (const eid of ecsifyApp.queryEntities(And(With(EcsifyPosition), With(EcsifyVelocity)))) {
				const velX = EcsifyVelocity.x[eid] ?? 0;
				const velY = EcsifyVelocity.y[eid] ?? 0;
				EcsifyPosition.x[eid] = (EcsifyPosition.x[eid] ?? 0) + velX * 0.016; // 60fps delta
				EcsifyPosition.y[eid] = (EcsifyPosition.y[eid] ?? 0) + velY * 0.016;
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
