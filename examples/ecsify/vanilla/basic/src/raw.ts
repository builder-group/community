import { createComponentRegistry, createEntityIndex, createQueryRegistry, Entity } from 'ecsify';

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

	// Register components
	componentRegistry.registerComponent(Position);
	componentRegistry.registerComponent(Velocity);
	componentRegistry.registerComponent(Rectangle);
	componentRegistry.registerComponent(Color);

	// Create entities
	for (let i = 0; i < 100; i++) {
		const entity = entityIndex.createEntity();

		// Add components
		componentRegistry.addComponent(entity, Position, {
			x: getRandom(canvas.width),
			y: getRandom(canvas.height)
		});
		componentRegistry.addComponent(entity, Velocity, {
			dx: getRandom(100, 20),
			dy: getRandom(100, 20)
		});
		componentRegistry.addComponent(entity, Rectangle, {
			width: getRandom(20, 10),
			height: getRandom(20, 10)
		});
		componentRegistry.addComponent(entity, Color, {
			value: `rgba(${getRandom(255)}, ${getRandom(255)}, ${getRandom(255)}, 1)`
		});
	}

	// Physics system
	function physicsSystem(dt: number): void {
		// Query components from query registry
		for (const [eid, pos, vel, rect] of queryRegistry.queryComponents([
			Entity,
			Position,
			Velocity,
			Rectangle
		] as const)) {
			// Move position
			pos.x += vel.dx * dt;
			pos.y += vel.dy * dt;

			// Boundary collision
			if (pos.x + rect.width > canvas.width) {
				pos.x = canvas.width - rect.width;
				vel.dx = -vel.dx;
			} else if (pos.x < 0) {
				pos.x = 0;
				vel.dx = -vel.dx;
			}

			if (pos.y + rect.height > canvas.height) {
				pos.y = canvas.height - rect.height;
				vel.dy = -vel.dy;
			} else if (pos.y < 0) {
				pos.y = 0;
				vel.dy = -vel.dy;
			}

			// Update components using component registry
			componentRegistry.updateComponent(eid, Position, pos);
			componentRegistry.updateComponent(eid, Velocity, vel);
		}
	}

	// Rendering system
	function renderingSystem(): void {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Query components
		for (const [pos, color, rect] of queryRegistry.queryComponents([
			Position,
			Color,
			Rectangle
		] as const)) {
			ctx.fillStyle = color.value;
			ctx.fillRect(pos.x, pos.y, rect.width, rect.height);
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
