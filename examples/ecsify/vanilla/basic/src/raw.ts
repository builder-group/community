import { And, createComponentRegistry, createEntityIndex, createQueryRegistry, With } from 'ecsify';

// Get canvas and context
const canvas =
	document.querySelector<HTMLCanvasElement>('#app canvas') || document.createElement('canvas');
if (canvas.parentElement == null) {
	canvas.width = 800;
	canvas.height = 600;
	document.querySelector<HTMLDivElement>('#app')!.innerHTML = '';
	document.querySelector<HTMLDivElement>('#app')!.appendChild(canvas);
}
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// Define components
const Position: { x: number[]; y: number[] } = { x: [], y: [] };
const Velocity: { dx: number[]; dy: number[] } = { dx: [], dy: [] };
const Rectangle: { width: number[]; height: number[] } = { width: [], height: [] };
const Color: { value: string[] } = { value: [] };

export function runRawExample(): void {
	console.log('🔧 Running ECS Raw Example');

	// Create registries
	const entityIndex = createEntityIndex();
	const componentRegistry = createComponentRegistry();
	const queryRegistry = createQueryRegistry(entityIndex, componentRegistry);

	// Create entities
	for (let i = 0; i < 1000; i++) {
		const eid = entityIndex.createEntity();

		// Add components
		componentRegistry.add(eid, Position, {
			x: getRandom(canvas.width),
			y: getRandom(canvas.height)
		});
		componentRegistry.add(eid, Velocity, {
			dx: getRandom(100, 20),
			dy: getRandom(100, 20)
		});
		componentRegistry.add(eid, Rectangle, {
			width: getRandom(20, 10),
			height: getRandom(20, 10)
		});
		componentRegistry.add(eid, Color, {
			value: `rgba(${getRandom(255)}, ${getRandom(255)}, ${getRandom(255)}, 1)`
		});
	}

	// Physics system
	function physicsSystem(dt: number): void {
		// Query components from query registry
		for (const eid of queryRegistry.queryEntities(
			And(With(Position), With(Velocity), With(Rectangle))
		)) {
			// Calculate new position
			Position.x[eid] += Velocity.dx[eid] * dt;
			Position.y[eid] += Velocity.dy[eid] * dt;

			// Boundary collision
			if (Position.x[eid] + Rectangle.width[eid] > canvas.width) {
				Position.x[eid] = canvas.width - Rectangle.width[eid];
				Velocity.dx[eid] = -Velocity.dx[eid];
			} else if (Position.x[eid] < 0) {
				Position.x[eid] = 0;
				Velocity.dx[eid] = -Velocity.dx[eid];
			}

			if (Position.y[eid] + Rectangle.height[eid] > canvas.height) {
				Position.y[eid] = canvas.height - Rectangle.height[eid];
				Velocity.dy[eid] = -Velocity.dy[eid];
			} else if (Position.y[eid] < 0) {
				Position.y[eid] = 0;
				Velocity.dy[eid] = -Velocity.dy[eid];
			}
		}
	}

	// Rendering system
	function renderingSystem(): void {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Query components
		for (const eid of queryRegistry.queryEntities(
			And(With(Position), With(Color), With(Rectangle))
		)) {
			ctx.fillStyle = Color.value[eid];
			ctx.fillRect(Position.x[eid], Position.y[eid], Rectangle.width[eid], Rectangle.height[eid]);
		}
	}

	// Game loop
	let lastTime = 0;
	function gameLoop(currentTime: number): void {
		const dt = (currentTime - lastTime) / 1000;
		lastTime = currentTime;

		// Run systems
		physicsSystem(dt);
		renderingSystem();

		// Clear change tracking
		componentRegistry.flush();

		requestAnimationFrame(gameLoop);
	}

	// Start game
	requestAnimationFrame(gameLoop);
}

// Helper function
function getRandom(max: number, min = 0): number {
	return Math.floor(Math.random() * (max - min)) + min;
}
