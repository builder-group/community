<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/ecsify/.github/banner.svg" alt="ecsify banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/ecsify">
        <img src="https://img.shields.io/bundlephobia/minzip/ecsify.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/ecsify">
        <img src="https://img.shields.io/npm/dt/featuer-state.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`ecsify` is a flexible, typesafe, and performance-focused [Entity Component System (ECS)](https://en.wikipedia.org/wiki/Entity_component_system) library for TypeScript.

- **🔮 Simple, declarative API**: Intuitive component patterns with full type safety
- **🍃 Lightweight & Tree Shakable**: Function-based and modular design
- **⚡ High Performance**: O(1) component checks using bitflags, cache-friendly sparse arrays
- **🔍 Powerful Querying**: Query entities with complex filters and get component data efficiently
- **📦 Zero Dependencies**: Standalone library ensuring ease of use in various environments
- **🔧 Flexible Storage**: Supports AoS, SoA, and marker component patterns
- **🧵 Change Tracking**: Built-in tracking for added, changed, and removed components

### 📚 Examples

- [Basic](https://github.com/builder-group/community/tree/develop/examples/ecsify/vanilla/basic) ([CodeSandbox](https://codesandbox.io/p/sandbox/822vss))

### 🌟 Motivation

Build a modern, type-safe ECS library that fully leverages TypeScript's type system without compromising performance. While libraries like [bitECS](https://github.com/NateTheGreatt/bitECS) offer good speed, they often lack robust TypeScript support and more advanced queries like `Added()`, `Removed()`, or `Changed()`. `ecsify` bridges this gap - combining high performance, full TypeScript integration, and powerful query capabilities - all while adhering to the KISS principle for a clean, intuitive API.

### ⚖️ Alternatives

- [bitecs](https://github.com/NateTheGreatt/bitECS)
- [koota](https://github.com/pmndrs/koota)
- [becsy](https://github.com/lastolivegames/becsy)
- [elics](https://github.com/elixr-games/elics)
- [ecsy](https://github.com/ecsyjs/ecsy)

## 📖 Usage

`ecsify` offers two approaches:

- [**App**](#app-approach-recommended): Better DX, type safety, unified API
- [**Raw**](#raw-approach-advanced): Maximum performance, direct memory access

Both approaches can be mixed in the same codebase. Most users start with [App](#app-approach-recommended). Use [Raw](#raw-approach-advanced) only for performance-critical code.

### App Approach (Recommended)

Better DX with plugins, systems, and unified API (slower than [Raw](#raw-approach-advanced) because of added abstractions):

```ts
import { createApp, createDefaultPlugin, Entity, TPlugin } from 'ecsify';

// Define plugin
type TGamePlugin = TPlugin<
	{
		name: 'Game';
		components: {
			Position: { x: number[]; y: number[] };
			Velocity: { dx: number[]; dy: number[] };
		};
	},
	[TDefaultPlugin]
>;

function createGamePlugin(): TGamePlugin {
	return {
		name: 'Game',
		deps: ['Default'],
		components: {
			Position: { x: [], y: [] },
			Velocity: { dx: [], dy: [] }
		},
		setup(app) {
			// Create entity
			const player = app.createEntity();
			app.addComponent(player, app.c.Position, { x: 0, y: 0 });
			app.addComponent(player, app.c.Velocity, { dx: 1, dy: 1 });

			// Register system
			app.addSystem(movementSystem, { set: 'Update' });
		}
	};
}

function movementSystem(app: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>) {
	for (const [eid, pos, vel] of app.queryComponents([
		Entity,
		app.c.Position,
		app.c.Velocity
	] as const)) { // 'as const' for type inference
		app.updateComponent(eid, app.c.Position, {
			x: pos.x + vel.dx,
			y: pos.y + vel.dy
		});
	}
}

// Create app
const app = createApp({
	plugins: [createDefaultPlugin(), createGamePlugin()] as const, // 'as const' for type inference
	systemSets: ['First', 'Update', 'Last'] // Execution order
});

// Game loop
function gameLoop() {
	app.update();
	requestAnimationFrame(gameLoop);
}
```

### Key Concepts

#### Entities

Numerical IDs representing game objects:

```ts
const player = app.createEntity();
const enemy = app.createEntity();
```

#### Components

Data containers:

```ts
// Array of Structures (AoS) - simpler
const Position: { x: number; y: number }[] = [];

// Structure of Arrays (SoA) - cache-friendly
const Position: { x: number[]; y: number[] } = { x: [], y: [] };

// Single arrays
const Health: number[] = [];

// Markers
const Player = {};
```

#### Systems

Functions that process entities:

```ts
function movementSystem(app: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>) {
	for (const [eid, pos, vel] of app.queryComponents([
		Entity,
		app.c.Position,
		app.c.Velocity
	] as const)) {
		pos.x += vel.dx;
		pos.y += vel.dy;
	}
}

app.addSystem(movementSystem, { set: 'Update' });
```

#### Queries

Filter entities:

```ts
import { Added, And, Changed, Or, Removed, With, Without } from 'ecsify';

// Filters
app.queryEntities(With(app.c.Player)); // Has component
app.queryEntities(Without(app.c.Dead)); // Lacks component
app.queryEntities(And(With(app.c.Position), With(app.c.Velocity))); // Has all components
app.queryEntities(Or(With(app.c.Player), With(app.c.Enemy))); // Has either component

// Change tracking
app.queryEntities(Added(app.c.Player)); // Component added this frame
app.queryEntities(Removed(app.c.Velocity)); // Component removed this frame
app.queryEntities(Changed(app.c.Health)); // Component changed this frame

// Query entities with components
for (const [eid, pos, vel] of app.queryComponents(
	[Entity, app.c.Position, app.c.Velocity] as const, // 'as const' for type inference
	With(app.c.Player)
)) {
	console.log(`Player ${eid} at (${pos.x}, ${pos.y})`);
}

// Query just entities
for (const eid of app.queryEntities(With(app.c.Enemy))) {
	console.log(`Enemy ${eid} at (${Position.x[eid]}, ${Position.y[eid]})`);
}

// For reactive queries with direct updates, mark changes manually
Position.x[entity] = 110;
app.markComponentChanged(entity, Position); // Required for Changed() queries
```

#### Resources

Global state (config, input, score):

```ts
type TGamePlugin = TPlugin<
	{
		name: 'Game';
		components: { Position: { x: number; y: number }[] };
		resources: {
			inputState: { jump: boolean };
			gameConfig: { gravity: number };
		};
	},
	[TDefaultPlugin]
>;

function createGamePlugin(): TGamePlugin {
	return {
		name: 'Game',
		deps: ['Default'],
		components: { Position: [] },
		resources: {
			inputState: { jump: false },
			gameConfig: { gravity: 9.8 }
		},
		setup(app) {
			app.addSystem(physicsSystem, { set: 'Update' });
		}
	};
}

function physicsSystem(app: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>) {
	const { inputState, gameConfig } = app.r;
	
	for (const [eid, pos] of app.queryComponents([Entity, app.c.Position] as const)) {
		if (inputState.jump) pos.y -= 100;
		pos.y += gameConfig.gravity;
	}
}

// Modify anywhere
app.r.inputState.jump = true;
```

#### App Extensions

Custom methods on app:

```ts
type TGamePlugin = TPlugin<
	{
		name: 'Game';
		components: {
			Position: { x: number; y: number }[];
			Health: number[];
			Dead: Record<string, never>;
		};
		resources: { inputState: { w: boolean; s: boolean } };
		appExtensions: {
			handleKeyDown: (key: string) => void;
			damageEntity: (eid: TEntityId, amount: number) => void;
			spawnEnemy: (x: number, y: number) => TEntityId;
		};
	},
	[TDefaultPlugin]
>;

function createGamePlugin(): TGamePlugin {
	return {
		name: 'Game',
		deps: ['Default'],
		components: { Position: [], Health: [], Dead: {} },
		resources: { inputState: { w: false, s: false } },
		appExtensions: {
			handleKeyDown(this: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>, key: string) {
				if (key === 'w') this.r.inputState.w = true;
				if (key === 's') this.r.inputState.s = true;
			},

			damageEntity(this: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>, eid: TEntityId, amount: number) {
				const health = this.c.Health[eid];
				if (health == null) return;
				
				this.updateComponent(eid, this.c.Health, health - amount);
				if (health - amount <= 0) this.addComponent(eid, this.c.Dead);
			},

			spawnEnemy(this: TApp<TAppContext<[TDefaultPlugin, TGamePlugin]>>, x: number, y: number): TEntityId {
				const enemy = this.createEntity();
				this.addComponent(enemy, this.c.Position, { x, y });
				this.addComponent(enemy, this.c.Health, 100);
				return enemy;
			}
		},
		setup(app) {
			const enemy = app.spawnEnemy(100, 200);
		}
	};
}

// Use anywhere
app.handleKeyDown('w');
app.damageEntity(enemy, 25);
```

### Component Operations

```ts
const player = app.createEntity();

// Add
app.addComponent(player, app.c.Position, { x: 100, y: 50 });
app.addComponent(player, app.c.Health, 100);
app.addComponent(player, app.c.Player); // Marker

// Update
app.updateComponent(player, app.c.Position, { x: 110 }); // Partial updates (only possible for SoA)
app.updateComponent(player, app.c.Health, 95);

// Direct access (faster)
app.c.Position.x[player] = 110;
app.markComponentChanged(player, app.c.Position); // Required for Changed() queries

// Remove
app.removeComponent(player, app.c.Velocity);

// Check
if (app.hasComponent(player, app.c.Player)) {
	// Is player
}
```

### Game Loop

```ts
function gameLoop() {
	app.update(); // Runs all registered systems
	requestAnimationFrame(gameLoop);
}
```

### Raw Approach (Advanced)

Direct memory access for maximum performance. You manage everything manually:

```ts
import { And, createComponentRegistry, createEntityIndex, createQueryRegistry, With } from 'ecsify';

// Create registries
const entityIndex = createEntityIndex();
const componentRegistry = createComponentRegistry();
const queryRegistry = createQueryRegistry(entityIndex, componentRegistry);

// Define components
const Position: { x: number[]; y: number[] } = { x: [], y: [] };
const Velocity: { dx: number[]; dy: number[] } = { dx: [], dy: [] };

// Create entity
const player = entityIndex.createEntity();
componentRegistry.addComponent(player, Position);
Position.x[player] = 0;
Position.y[player] = 0;
componentRegistry.addComponent(player, Velocity);
Velocity.dx[player] = 1;
Velocity.dy[player] = 1;

// Systems are just functions
function movementSystem() {
	for (const eid of queryRegistry.queryEntities(And(With(Position), With(Velocity)))) {
		Position.x[eid] += Velocity.dx[eid];
		Position.y[eid] += Velocity.dy[eid];
	}
}

// Game loop
function gameLoop() {
	movementSystem();
	componentRegistry.flush(); // Clear change tracking
	requestAnimationFrame(gameLoop);
}
```

## 📐 Architecture

### Entity Index (`create-entity-index.ts`)

Efficient entity ID management using sparse-dense array pattern with optional versioning. Provides O(1) operations while maintaining cache-friendly iteration.

#### Sparse-Dense Pattern

```
Sparse Array:  [_, 0, _, 2, 1, _, _]  ← Maps entity ID → dense index
                 1  2  3  4  5  6  7   ← Entity IDs

Dense Array:   [2, 5, 4, 7, 3]        ← Alive entities (cache-friendly)
               [0, 1, 2, 3, 4]        ← Indices
               └─alive─┘ └dead┘

aliveCount: 3  ← First 3 elements are alive
```

**Core Data:**

- **Sparse Array**: Maps base entity IDs to dense array positions
- **Dense Array**: Contiguous alive entities, with dead entities at end
- **Alive Count**: Boundary between alive/dead entities

#### Entity ID Format

```
32-bit Entity ID = [Version Bits | Entity ID Bits]

Example with 8 version bits:
┌─ Version (8 bits) ─┐┌─── Entity ID (24 bits) ───┐
00000001              000000000000000000000001
│                     │
└─ Version 1          └─ Base Entity ID 1
```

#### Why This Design?

**Problem: Stale References**

```typescript
const entity = addEntity(); // Returns ID 5
removeEntity(entity); // Removes ID 5
const newEntity = addEntity(); // Might reuse ID 5!
// Bug: old reference to ID 5 now points to wrong entity
```

**Solution: Versioning**

```typescript
const entity = addEntity(); // Returns 5v0 (ID 5, version 0)
removeEntity(entity); // Increments to 5v1
const newEntity = addEntity(); // Reuses base ID 5 but as 5v1
// Safe: old reference (5v0) won't match new entity (5v1)
```

**Swap-and-Pop for O(1) Removal**

```typescript
// Remove entity at index 1:
dense = [1, 2, 3, 4, 5];
// 1. Swap with last: [1, 5, 3, 4, 2]
// 2. Decrease alive count
// Result: [1, 5, 3, 4 | 2] - only alive section matters
```

**Performance:** O(1) all operations, ~8 bytes per entity, cache-friendly iteration.

### Query Registry (`create-query-registry.ts`)

Entity filtering with two strategies: bitmask optimization for simple queries, individual evaluation for complex queries.

#### Query Filters

```typescript
// Component filters
With(Position); // Entity must have component
Without(Dead); // Entity must not have component

// Change detection
Added(Position); // Component added this frame
Changed(Health); // Component modified this frame
Removed(Velocity); // Component removed this frame

// Logical operators
And(With(Position), With(Velocity)); // All must match
Or(With(Player), With(Enemy)); // Any must match
```

#### Evaluation Strategies

**Bitmask Strategy** - Fast bitwise operations:

```typescript
// Components get bit positions
Position: bitflag=0b001, Velocity: bitflag=0b010, Health: bitflag=0b100

// Entity masks show what components each entity has
entity1: 0b011  // Has Position + Velocity
entity2: 0b101  // Has Position + Health

// Query: And(With(Position), With(Velocity)) → andMasks.with = 0b011
// Check: (entityMask & 0b011) === 0b011
entity1: (0b011 & 0b011) === 0b011  ✓ true
entity2: (0b101 & 0b011) === 0b011  ✗ false
```

**Individual Strategy** - Per-filter evaluation for complex queries:

```typescript
// Complex queries like Or(With(Position), Changed(Health))
// Fall back to: filters.some(filter => filter.evaluate(app, eid))
```

#### Performance (10,000 entities)

```
  individual + cached - __tests__/query.bench.ts > Query Performance > With(Position)
    1.04x faster than bitmask + cached
    7.50x faster than bitmask + no cache
    7.83x faster than individual + no cache

  bitmask + cached - __tests__/query.bench.ts > Query Performance > And(With(Position), With(Velocity))
    1.01x faster than individual + cached
    13.58x faster than bitmask + no cache
    13.72x faster than individual + no cache
```

**Key Insight:** Caching matters most (7-14x faster than no cache). Bitmask vs individual evaluation shows minimal difference.

### Component Registry (`create-component-registry.ts`)

Component management with direct array access, unlimited components via generations, and flexible storage patterns.

#### Component Patterns

```typescript
// Array of Structures (AoS) - good for complete entity data
const Transform = [];
Transform[eid] = { x: 10, y: 20 };

// Structure of Arrays (SoA) - cache-friendly for bulk operations
const Position = { x: [], y: [] };
Position.x[eid] = 10;
Position.y[eid] = 20;

// Single arrays and marker components
const Health = []; // Health[eid] = 100
const Player = {}; // Just presence/absence
```

#### Generation System

Unlimited components beyond 31-bit limit:

**Why Generations?** Bitmasks need one bit per component for fast O(1) checks. JavaScript integers are 32-bit, giving us only 31 usable bits (0 - 30, bit 31 is sign). So we can only track 31 components per bitmask.

```typescript
// Problem: Only 31 components fit in one integer bitmask
// Bits:  31 30 29 28 ... 3  2  1  0
// Components: ❌ ✓  ✓  ✓ ... ✓  ✓  ✓  ✓  (31 components max)

// Solution: Multiple generations, each with 31 components
// Generation 0: Components 0-30 (bitflags 1, 2, 4, ..., 2^30)
Position: { generationId: 0, bitflag: 0b001 }
Velocity: { generationId: 0, bitflag: 0b010 }

// Generation 1: Components 31+ (bitflags restart)
Armor:    { generationId: 1, bitflag: 0b001 }
Weapon:   { generationId: 1, bitflag: 0b010 }

// Entity masks stored per generation
_entityMasks[0][eid] = 0b011;  // Has Position + Velocity
_entityMasks[1][eid] = 0b001;  // Has Armor
```

#### Bitmask Operations

```typescript
// Adding component: OR with bitflag
entityMask |= 0b010; // Add Velocity

// Removing component: AND with inverted bitflag
entityMask &= ~0b010; // Remove Velocity

// Checking component: AND with bitflag
const hasVelocity = (entityMask & 0b010) !== 0;
```

#### Change Tracking

```typescript
// Separate masks track changes per frame
_addedMasks[0][eid] |= bitflag;    // Component added
_changedMasks[0][eid] |= bitflag;  // Component changed
_removedMasks[0][eid] |= bitflag;  // Component removed

// Clear at frame end
flush() { /* clear all change masks */ }
```

## 📚 Good to Know

### Sparse vs Dense Arrays

JavaScript sparse arrays store only assigned indices, making them memory-efficient:

```ts
const sparse = [];
sparse[1000] = 5; // [<1000 empty items>, 5]

console.log(sparse.length); // 1001
console.log(sparse[500]); // undefined (no memory used)
```

In contrast, dense arrays allocate memory for every element, even if unused:

```ts
const dense = new Array(1001).fill(0); // Allocates 1001 × 4 bytes = ~4KB

console.log(dense.length); // 1001
console.log(dense[500]); // 0
```

Use sparse arrays for large, mostly empty datasets. Use dense arrays when you need consistent iteration and performance.

## 💡 Resources / References

- [BitECS](https://github.com/NateTheGreatt/bitECS) - High-performance ECS library that inspired our implementation
- [Bevy](https://github.com/bevyengine/bevy) - Data-driven game engine built in Rust that inspired our API
- [Data Oriented Design and Entity Component System Explained](https://www.youtube.com/watch?v=xm4AQj5PHT4)
