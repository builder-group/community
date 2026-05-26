import {
	createApp,
	createDefaultPlugin,
	Entity,
	type TApp,
	type TAppContext,
	type TDefaultPlugin,
	type TPlugin
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
		systemSets: 'First' | 'Update' | 'Last' | 'Flush';
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
		systemSets: ['First', 'Update', 'Last', 'Flush']
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
		setup: (app: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>) => {
			// Create entities
			for (let i = 0; i < 1000; i++) {
				const eid = app.createEntity();

				app.addComponent(eid, app.c.Position, {
					x: getRandom(canvas.width),
					y: getRandom(canvas.height)
				});
				app.addComponent(eid, app.c.Velocity, {
					dx: getRandom(100, 20),
					dy: getRandom(100, 20)
				});
				app.addComponent(eid, app.c.Rectangle, {
					width: getRandom(20, 10),
					height: getRandom(20, 10)
				});
				app.addComponent(eid, app.c.Color, {
					value: `rgba(${getRandom(255)}, ${getRandom(255)}, ${getRandom(255)}, 1)`
				});
			}

			// Add systems
			app.addSystem(physicsSystem, { set: 'Update' });
			app.addSystem(renderingSystem, { set: 'Update', after: physicsSystem });
		}
	};
}

// Physics system
function physicsSystem(app: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>, dt = 0.016) {
	for (const [eid, pos, vel, rect] of app.queryComponents([
		Entity,
		app.c.Position,
		app.c.Velocity,
		app.c.Rectangle
	] as const)) {
		// Calculate new position
		let newX = pos.x + vel.dx * dt;
		let newY = pos.y + vel.dy * dt;
		let newDx = vel.dx;
		let newDy = vel.dy;

		// Boundary collision
		if (newX + rect.width > canvas.width) {
			newX = canvas.width - rect.width;
			newDx = -newDx;
		} else if (newX < 0) {
			newX = 0;
			newDx = -newDx;
		}

		if (newY + rect.height > canvas.height) {
			newY = canvas.height - rect.height;
			newDy = -newDy;
		} else if (newY < 0) {
			newY = 0;
			newDy = -newDy;
		}

		// Update components
		app.updateComponent(eid, app.c.Position, { x: newX, y: newY });
		app.updateComponent(eid, app.c.Velocity, { dx: newDx, dy: newDy });
	}
}

// Rendering system
const renderingSystem = (app: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>) => {
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
