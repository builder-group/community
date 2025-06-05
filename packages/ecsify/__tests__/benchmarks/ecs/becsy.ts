import { field, System, World } from '@lastolivegames/becsy';

export function createBecsyBenchmarks(random: {
	next(): number;
	nextBool(prob?: number): boolean;
}) {
	return {
		async entityCreation() {
			const world = await World.create();

			return {
				createEntity() {
					world.createEntity();
				}
			};
		},

		async componentAddition() {
			class Position {
				@field.float32 declare x: number;
				@field.float32 declare y: number;
			}

			const world = await World.create({ defs: [Position] });

			return {
				addPositionComponent() {
					world.createEntity(Position, { x: 100, y: 200 });
				}
			};
		},

		async componentQueries() {
			class Position {
				@field.float32 declare x: number;
				@field.float32 declare y: number;
			}

			class Velocity {
				@field.float32 declare x: number;
				@field.float32 declare y: number;
			}

			class Health {
				@field.float32 declare value: number;
			}

			class PosQuerySystem extends System {
				entities = this.query((q) => q.current.with(Position));

				execute() {
					return this.entities.current.length;
				}
			}

			class PosVelQuerySystem extends System {
				entities = this.query((q) => q.current.with(Position, Velocity));

				execute() {
					return this.entities.current.length;
				}
			}

			const posWorld = await World.create({ defs: [Position, Velocity, Health, PosQuerySystem] });
			const posVelWorld = await World.create({
				defs: [Position, Velocity, Health, PosVelQuerySystem]
			});

			// Setup entities for querying
			for (let i = 0; i < 1000; i++) {
				const components: any[] = [];
				if (random.nextBool(0.7)) {
					components.push(Position, { x: i, y: i * 2 });
				}
				if (random.nextBool(0.5)) {
					components.push(Velocity, { x: 1.5, y: 2.0 });
				}
				if (random.nextBool(0.3)) {
					components.push(Health, { value: 100 });
				}
				if (components.length > 0) {
					posWorld.createEntity(...components);
					posVelWorld.createEntity(...components);
				}
			}

			return {
				async queryPositionComponents() {
					await posWorld.execute();
				},

				async queryPositionAndVelocity() {
					await posVelWorld.execute();
				}
			};
		},

		async systemIteration() {
			class Position {
				@field.float32 declare x: number;
				@field.float32 declare y: number;
			}

			class Velocity {
				@field.float32 declare x: number;
				@field.float32 declare y: number;
			}

			class MovementSystem extends System {
				movables = this.query((q) => q.current.with(Position, Velocity).write);

				execute() {
					for (const entity of this.movables.current) {
						const velocity = entity.read(Velocity);
						const position = entity.write(Position);
						position.x += velocity.x * 0.016;
						position.y += velocity.y * 0.016;
					}
				}
			}

			const world = await World.create({ defs: [Position, Velocity, MovementSystem] });

			// Setup entities for system iteration
			for (let i = 0; i < 5000; i++) {
				const posX = random.next() * 1000;
				const posY = random.next() * 1000;
				const velX = (random.next() - 0.5) * 10;
				const velY = (random.next() - 0.5) * 10;

				world.createEntity(Position, { x: posX, y: posY }, Velocity, { x: velX, y: velY });
			}

			return {
				async movementSystemIteration() {
					await world.execute();
				}
			};
		}
	};
}
