import {
	createApp,
	createDefaultPlugin,
	Entity,
	type TDefaultPlugin,
	type TPlugin,
	type TPluginSystemFn
} from 'ecsify';

// Get canvas context
const canvas =
	document.querySelector<HTMLCanvasElement>('#app canvas') || document.createElement('canvas');
if (canvas.parentElement == null) {
	canvas.width = 800;
	canvas.height = 600;
	document.querySelector<HTMLDivElement>('#app')!.innerHTML = '';
	document.querySelector<HTMLDivElement>('#app')!.appendChild(canvas);
}
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// Define plugin
export type TGamePlugin = TPlugin<
	{
		name: 'Game';
		components: {
			Position: TCPosition;
			Velocity: TCVelocity;
			Rectangle: TCRectangle;
			Color: TCColor;
		};
		systemSets: 'First' | 'Update' | 'Last';
	},
	[TDefaultPlugin]
>;

// Define components
export type TCPosition = { x: number[]; y: number[] };
export type TCVelocity = { dx: number[]; dy: number[] };
export type TCRectangle = { width: number[]; height: number[] };
export type TCColor = { value: string[] };

export function runAppExample(): void {
	console.log('🚀 Running ECS App Example');

	// Create app with GamePlugin
	const app = createApp({
		plugins: [createDefaultPlugin(), createGamePlugin()] as const,
		systemSets: ['First', 'Update', 'Last']
	});

	// Game loop
	let lastTime = 0;

	function gameLoop(currentTime: number): void {
		const dt = (currentTime - lastTime) / 1000;
		lastTime = currentTime;

		// Update app systems
		app.update(dt);

		requestAnimationFrame(gameLoop);
	}

	// Start game
	requestAnimationFrame(gameLoop);
}

export function createGamePlugin(): TGamePlugin {
	return {
		name: 'Game',
		deps: ['Default'],
		components: {
			Position: { x: [], y: [] },
			Velocity: { dx: [], dy: [] },
			Rectangle: { width: [], height: [] },
			Color: { value: [] }
		},
		setup: (app) => {
			// Create entities
			for (let i = 0; i < 100; i++) {
				const entity = app.createEntity();

				app.addComponent(entity, app.c.Position, {
					x: getRandom(canvas.width),
					y: getRandom(canvas.height)
				});
				app.addComponent(entity, app.c.Velocity, {
					dx: getRandom(100, 20),
					dy: getRandom(100, 20)
				});
				app.addComponent(entity, app.c.Rectangle, {
					width: getRandom(20, 10),
					height: getRandom(20, 10)
				});
				app.addComponent(entity, app.c.Color, {
					value: `rgba(${getRandom(255)}, ${getRandom(255)}, ${getRandom(255)}, 1)`
				});
			}

			// Add systems
			app.addSystem(physicsSystem, { set: 'Update' });
			app.addSystem(renderingSystem, { set: 'Update' });
		}
	};
}

// Physics system
const physicsSystem: TPluginSystemFn<TGamePlugin> = (app, dt = 0.016) => {
	for (const [eid, pos, vel, rect] of app.queryComponents([
		Entity,
		app.c.Position,
		app.c.Velocity,
		app.c.Rectangle
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

		// Update components
		app.updateComponent(eid, app.c.Position, pos);
		app.updateComponent(eid, app.c.Velocity, vel);
	}
};

// Rendering system
const renderingSystem: TPluginSystemFn<TGamePlugin> = (app) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	for (const [pos, color, rect] of app.queryComponents([
		app.c.Position,
		app.c.Color,
		app.c.Rectangle
	] as const)) {
		ctx.fillStyle = color.value;
		ctx.fillRect(pos.x, pos.y, rect.width, rect.height);
	}
};

// Helper function
function getRandom(max: number, min = 0): number {
	return Math.floor(Math.random() * (max - min)) + min;
}
