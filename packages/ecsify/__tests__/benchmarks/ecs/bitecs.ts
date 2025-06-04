import {
	addComponent as bitECSAddComponent,
	addEntity as bitECSAddEntity,
	query as bitECSQuery,
	createWorld
} from 'bitecs';

export function createBitEcsBenchmarks(random: {
	next(): number;
	nextBool(prob?: number): boolean;
}) {
	const world = createWorld();

	return {
		entityCreation() {
			return {
				createEntity() {
					const eid = bitECSAddEntity(world);
					return eid >= 0;
				}
			};
		},

		componentAddition() {
			const Position = { x: [] as number[], y: [] as number[] };

			return {
				addPositionComponent() {
					const eid = bitECSAddEntity(world);
					bitECSAddComponent(world, eid, Position);
					Position.x[eid] = 100;
					Position.y[eid] = 200;
				}
			};
		},

		componentQueries() {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health = [] as number[];

			// Setup entities for querying
			for (let i = 0; i < 1000; i++) {
				const eid = bitECSAddEntity(world);
				if (random.nextBool(0.7)) {
					bitECSAddComponent(world, eid, Position);
					Position.x[eid] = i;
					Position.y[eid] = i * 2;
				}
				if (random.nextBool(0.5)) {
					bitECSAddComponent(world, eid, Velocity);
					Velocity.x[eid] = 1.5;
					Velocity.y[eid] = 2.0;
				}
				if (random.nextBool(0.3)) {
					bitECSAddComponent(world, eid, Health);
					Health[eid] = 100;
				}
			}

			return {
				queryPositionComponents() {
					const entities = Array.from(bitECSQuery(world, [Position]));
					return entities.length;
				},

				queryPositionAndVelocity() {
					const entities = bitECSQuery(world, [Position, Velocity]);
					return entities.length;
				}
			};
		},

		systemIteration() {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };

			// Setup entities for system iteration
			for (let i = 0; i < 5000; i++) {
				const posX = random.next() * 1000;
				const posY = random.next() * 1000;
				const velX = (random.next() - 0.5) * 10;
				const velY = (random.next() - 0.5) * 10;

				const eid = bitECSAddEntity(world);
				bitECSAddComponent(world, eid, Position);
				bitECSAddComponent(world, eid, Velocity);
				Position.x[eid] = posX;
				Position.y[eid] = posY;
				Velocity.x[eid] = velX;
				Velocity.y[eid] = velY;
			}

			return {
				movementSystemIteration() {
					let updateCount = 0;

					for (const eid of bitECSQuery(world, [Position, Velocity])) {
						const velX = Velocity.x[eid] ?? 0;
						const velY = Velocity.y[eid] ?? 0;
						Position.x[eid] = (Position.x[eid] ?? 0) + velX * 0.016;
						Position.y[eid] = (Position.y[eid] ?? 0) + velY * 0.016;
						updateCount++;
					}

					return updateCount;
				}
			};
		}
	};
}
