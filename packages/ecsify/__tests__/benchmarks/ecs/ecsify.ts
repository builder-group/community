import { And, createApp, With } from '../../../src';

export function createEcsifyBenchmarks(random: {
	next(): number;
	nextBool(prob?: number): boolean;
}) {
	const app = createApp({ plugins: [], systemSets: [] });

	return {
		entityCreation() {
			return {
				createEntity() {
					app.createEntity();
				}
			};
		},

		componentAddition() {
			const Position = { x: [] as number[], y: [] as number[] };

			return {
				addPositionComponent() {
					const eid = app.createEntity();
					app.addComponent(eid, Position);
					Position.x[eid] = 100;
					Position.y[eid] = 200;
				}
			};
		},

		componentQueries() {
			const Position = { x: [] as number[], y: [] as number[] };
			const Velocity = { x: [] as number[], y: [] as number[] };
			const Health: number[] = [];

			// Setup entities for querying
			for (let i = 0; i < 1000; i++) {
				const eid = app.createEntity();
				if (random.nextBool(0.7)) {
					app.addComponent(eid, Position);
					Position.x[eid] = i;
					Position.y[eid] = i * 2;
				}
				if (random.nextBool(0.5)) {
					app.addComponent(eid, Velocity);
					Velocity.x[eid] = 1.5;
					Velocity.y[eid] = 2.0;
				}
				if (random.nextBool(0.3)) {
					app.addComponent(eid, Health);
					Health[eid] = 100;
				}
			}

			return {
				queryPositionComponents() {
					app.queryEntities(With(Position));
				},

				queryPositionAndVelocity() {
					app.queryEntities(And(With(Position), With(Velocity)));
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

				const eid = app.createEntity();
				app.addComponent(eid, Position);
				app.addComponent(eid, Velocity);
				Position.x[eid] = posX;
				Position.y[eid] = posY;
				Velocity.x[eid] = velX;
				Velocity.y[eid] = velY;
			}

			return {
				movementSystemIteration() {
					for (const eid of app.queryEntities(And(With(Position), With(Velocity)))) {
						const velX = Velocity.x[eid] ?? 0;
						const velY = Velocity.y[eid] ?? 0;
						Position.x[eid] = (Position.x[eid] ?? 0) + velX * 0.016;
						Position.y[eid] = (Position.y[eid] ?? 0) + velY * 0.016;
					}
				}
			};
		}
	};
}
