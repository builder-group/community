import { createSeededRandom } from '@blgc/utils';
import { bench, describe } from 'vitest';
import { createBitEcsBenchmarks, createEcsifyBenchmarks, createElicsBenchmarks } from './ecs';

describe('ECS Performance Comparison', () => {
	const seed = 42; // Fixed seed for consistent results

	// Create benchmark instances for each ECS
	const ecsifyBenchmarks = createEcsifyBenchmarks(createSeededRandom(seed));
	const bitecsBenchmarks = createBitEcsBenchmarks(createSeededRandom(seed));
	const elicsBenchmarks = createElicsBenchmarks(createSeededRandom(seed));

	describe('Entity Creation', () => {
		const ecsifyEntityCreation = ecsifyBenchmarks.entityCreation();
		const bitecsEntityCreation = bitecsBenchmarks.entityCreation();
		const elicsEntityCreation = elicsBenchmarks.entityCreation();

		bench('Ecsify - Create entity', () => {
			ecsifyEntityCreation.createEntity();
		});

		bench('BitECS - Create entity', () => {
			bitecsEntityCreation.createEntity();
		});

		bench('EliCS - Create entity', () => {
			elicsEntityCreation.createEntity();
		});
	});

	describe('Component Addition', () => {
		const ecsifyComponentAddition = ecsifyBenchmarks.componentAddition();
		const bitecsComponentAddition = bitecsBenchmarks.componentAddition();
		const elicsComponentAddition = elicsBenchmarks.componentAddition();

		bench('Ecsify - Add Position component', () => {
			ecsifyComponentAddition.addPositionComponent();
		});

		bench('BitECS - Add Position component', () => {
			bitecsComponentAddition.addPositionComponent();
		});

		bench('EliCS - Add Position component', () => {
			elicsComponentAddition.addPositionComponent();
		});
	});

	describe('Component Queries', () => {
		const ecsifyComponentQueries = ecsifyBenchmarks.componentQueries();
		const bitecsComponentQueries = bitecsBenchmarks.componentQueries();
		const elicsComponentQueries = elicsBenchmarks.componentQueries();

		bench('Ecsify - Query Position components', () => {
			ecsifyComponentQueries.queryPositionComponents();
		});

		bench('BitECS - Query Position components', () => {
			bitecsComponentQueries.queryPositionComponents();
		});

		bench('EliCS - Query Position components', () => {
			elicsComponentQueries.queryPositionComponents();
		});

		bench('Ecsify - Query Position + Velocity', () => {
			ecsifyComponentQueries.queryPositionAndVelocity();
		});

		bench('BitECS - Query Position + Velocity', () => {
			bitecsComponentQueries.queryPositionAndVelocity();
		});

		bench('EliCS - Query Position + Velocity', () => {
			elicsComponentQueries.queryPositionAndVelocity();
		});
	});

	describe('System Iteration Performance', () => {
		const ecsifySystemIteration = ecsifyBenchmarks.systemIteration();
		const bitecsSystemIteration = bitecsBenchmarks.systemIteration();
		const elicsSystemIteration = elicsBenchmarks.systemIteration();

		bench('Ecsify - Movement system iteration', () => {
			ecsifySystemIteration.movementSystemIteration();
		});

		bench('BitECS - Movement system iteration', () => {
			bitecsSystemIteration.movementSystemIteration();
		});

		bench('EliCS - Movement system iteration', () => {
			elicsSystemIteration.movementSystemIteration();
		});
	});
});
