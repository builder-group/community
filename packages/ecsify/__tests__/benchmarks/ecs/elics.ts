import { createComponent, createSystem, Types, World } from 'elics';

export function createElicsBenchmarks(random: {
	next(): number;
	nextBool(prob?: number): boolean;
}) {
	const world = new World({ entityCapacity: 10000, checksOn: false });

	return {
		entityCreation() {
			return {
				createEntity() {
					world.createEntity();
				}
			};
		},

		componentAddition() {
			const Position = createComponent({
				x: { type: Types.Float32, default: 0 },
				y: { type: Types.Float32, default: 0 }
			});
			world.registerComponent(Position);

			return {
				addPositionComponent() {
					const entity = world.createEntity();
					entity.addComponent(Position, { x: 100, y: 200 });
				}
			};
		},

		componentQueries() {
			const Position = createComponent({
				x: { type: Types.Float32, default: 0 },
				y: { type: Types.Float32, default: 0 }
			});
			const Velocity = createComponent({
				x: { type: Types.Float32, default: 0 },
				y: { type: Types.Float32, default: 0 }
			});
			const Health = createComponent({
				value: { type: Types.Float32, default: 0 }
			});

			world.registerComponent(Position).registerComponent(Velocity).registerComponent(Health);

			// Setup entities for querying
			for (let i = 0; i < 1000; i++) {
				const entity = world.createEntity();
				if (random.nextBool(0.7)) {
					entity.addComponent(Position, { x: i, y: i * 2 });
				}
				if (random.nextBool(0.5)) {
					entity.addComponent(Velocity, { x: 1.5, y: 2.0 });
				}
				if (random.nextBool(0.3)) {
					entity.addComponent(Health, { value: 100 });
				}
			}

			// Create query systems
			class PosQuerySystem extends createSystem({
				positionEntities: { required: [Position] }
			}) {
				getPositionEntities() {
					return this.queries.positionEntities.entities;
				}
			}

			class PosVelQuerySystem extends createSystem({
				movableEntities: { required: [Position, Velocity] }
			}) {
				getMovableEntities() {
					return this.queries.movableEntities.entities;
				}
			}

			world.registerSystem(PosQuerySystem);
			const posQuerySystem = world.getSystem(PosQuerySystem);

			world.registerSystem(PosVelQuerySystem);
			const posVelQuerySystem = world.getSystem(PosVelQuerySystem);

			return {
				queryPositionComponents() {
					posQuerySystem?.getPositionEntities();
				},

				queryPositionAndVelocity() {
					posVelQuerySystem?.getMovableEntities();
				}
			};
		},

		systemIteration() {
			const Position = createComponent({
				x: { type: Types.Float32, default: 0 },
				y: { type: Types.Float32, default: 0 }
			});
			const Velocity = createComponent({
				x: { type: Types.Float32, default: 0 },
				y: { type: Types.Float32, default: 0 }
			});

			world.registerComponent(Position).registerComponent(Velocity);

			// Setup entities for system iteration
			for (let i = 0; i < 5000; i++) {
				const posX = random.next() * 1000;
				const posY = random.next() * 1000;
				const velX = (random.next() - 0.5) * 10;
				const velY = (random.next() - 0.5) * 10;

				const entity = world.createEntity();
				entity.addComponent(Position, { x: posX, y: posY });
				entity.addComponent(Velocity, { x: velX, y: velY });
			}

			// Create movement system
			class MovementSystem extends createSystem({
				movables: { required: [Position, Velocity] }
			}) {
				updateMovement() {
					let updateCount = 0;
					for (const entity of this.queries.movables.entities) {
						const idx = entity.index;
						const velX = Velocity.data.x[idx] ?? 0;
						const velY = Velocity.data.y[idx] ?? 0;
						Position.data.x[idx] = (Position.data.x[idx] ?? 0) + velX * 0.016;
						Position.data.y[idx] = (Position.data.y[idx] ?? 0) + velY * 0.016;
						updateCount++;
					}
					return updateCount;
				}
			}

			world.registerSystem(MovementSystem);
			const movementSystem = world.getSystem(MovementSystem);

			return {
				movementSystemIteration() {
					movementSystem?.updateMovement();
				}
			};
		}
	};
}
