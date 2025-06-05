import { createSeededRandom } from '@blgc/utils';
import { bench, describe } from 'vitest';
import { createBitEcsBenchmarks, createEcsifyBenchmarks, createElicsBenchmarks } from './ecs';

describe('ECS Performance Comparison', () => {
	const seed = 42; // Fixed seed for consistent results

	// Create benchmark instances for each ECS
	const ecsifyBenchmarks = createEcsifyBenchmarks(createSeededRandom(seed));
	const bitecsBenchmarks = createBitEcsBenchmarks(createSeededRandom(seed));
	const elicsBenchmarks = createElicsBenchmarks(createSeededRandom(seed));
	// const becsyBenchmarks = createBecsyBenchmarks(createSeededRandom(seed));

	describe('Entity Creation', async () => {
		const ecsifyEntityCreation = ecsifyBenchmarks.entityCreation();
		const bitecsEntityCreation = bitecsBenchmarks.entityCreation();
		const elicsEntityCreation = elicsBenchmarks.entityCreation();
		// const becsyEntityCreation = await becsyBenchmarks.entityCreation();

		bench('Ecsify - Create entity', () => {
			ecsifyEntityCreation.createEntity();
		});

		bench('BitECS - Create entity', () => {
			bitecsEntityCreation.createEntity();
		});

		bench('EliCS - Create entity', () => {
			elicsEntityCreation.createEntity();
		});

		// bench('Becsy - Create entity', () => {
		// 	becsyEntityCreation.createEntity();
		// });
	});

	describe('Component Addition', async () => {
		const ecsifyComponentAddition = ecsifyBenchmarks.componentAddition();
		const bitecsComponentAddition = bitecsBenchmarks.componentAddition();
		const elicsComponentAddition = elicsBenchmarks.componentAddition();
		// const becsyComponentAddition = await becsyBenchmarks.componentAddition();

		bench('Ecsify - Add Position component', () => {
			ecsifyComponentAddition.addPositionComponent();
		});

		bench('BitECS - Add Position component', () => {
			bitecsComponentAddition.addPositionComponent();
		});

		bench('EliCS - Add Position component', () => {
			elicsComponentAddition.addPositionComponent();
		});

		// bench('Becsy - Add Position component', () => {
		// 	becsyComponentAddition.addPositionComponent();
		// });
	});

	describe('Component Queries', async () => {
		const ecsifyComponentQueries = ecsifyBenchmarks.componentQueries();
		const bitecsComponentQueries = bitecsBenchmarks.componentQueries();
		const elicsComponentQueries = elicsBenchmarks.componentQueries();
		// const becsyComponentQueries = await becsyBenchmarks.componentQueries();

		bench('Ecsify - Query Position components', () => {
			ecsifyComponentQueries.queryPositionComponents();
		});

		bench('BitECS - Query Position components', () => {
			bitecsComponentQueries.queryPositionComponents();
		});

		bench('EliCS - Query Position components', () => {
			elicsComponentQueries.queryPositionComponents();
		});

		// bench('Becsy - Query Position components', async () => {
		// 	await becsyComponentQueries.queryPositionComponents();
		// });

		bench('Ecsify - Query Position + Velocity', () => {
			ecsifyComponentQueries.queryPositionAndVelocity();
		});

		bench('BitECS - Query Position + Velocity', () => {
			bitecsComponentQueries.queryPositionAndVelocity();
		});

		bench('EliCS - Query Position + Velocity', () => {
			elicsComponentQueries.queryPositionAndVelocity();
		});

		// bench('Becsy - Query Position + Velocity', async () => {
		// 	await becsyComponentQueries.queryPositionAndVelocity();
		// });
	});

	describe('System Iteration Performance', async () => {
		const ecsifySystemIteration = ecsifyBenchmarks.systemIteration();
		const bitecsSystemIteration = bitecsBenchmarks.systemIteration();
		const elicsSystemIteration = elicsBenchmarks.systemIteration();
		// const becsySystemIteration = await becsyBenchmarks.systemIteration();

		bench('Ecsify - Movement system iteration', () => {
			ecsifySystemIteration.movementSystemIteration();
		});

		bench('BitECS - Movement system iteration', () => {
			bitecsSystemIteration.movementSystemIteration();
		});

		bench('EliCS - Movement system iteration', () => {
			elicsSystemIteration.movementSystemIteration();
		});

		// bench('Becsy - Movement system iteration', async () => {
		// 	await becsySystemIteration.movementSystemIteration();
		// });
	});
});
