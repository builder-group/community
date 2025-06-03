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

`ecsify` is a flexible, typesafe, and performance-focused Entity Component System (ECS) library for TypeScript.

- **🔮 Simple, declarative API**: Intuitive component patterns with full type safety
- **🍃 Lightweight & Tree Shakable**: Function-based and modular design
- **⚡ High Performance**: O(1) component checks using bitflags, cache-friendly sparse arrays
- **🔍 Powerful Querying**: Query entities with complex filters and get component data efficiently
- **📦 Zero Dependencies**: Standalone library ensuring ease of use in various environments
- **🔧 Flexible Storage**: Supports AoS, SoA, and marker component patterns
- **🧵 Change Tracking**: Built-in tracking for added, changed, and removed components

### 📚 Examples

- [Basic](https://github.com/builder-group/community/tree/develop/examples/ecsify/vanilla/basic)

### 🌟 Motivation

Build a modern, type-safe ECS library that fully leverages TypeScript's type system without compromising performance. While libraries like [bitECS](https://github.com/NateTheGreatt/bitECS) offer good speed, they often lack robust TypeScript support and more advanced queries like `Added()`, `Removed()`, or `Changed()`. `ecsify` bridges this gap—combining high performance, full TypeScript integration, and powerful query capabilities—all while adhering to the KISS principle for a clean, intuitive API.

### ⚖️ Alternatives

- [bitECS](https://github.com/NateTheGreatt/bitECS)
- [ecsy](https://github.com/ecsyjs/ecsy)

## 📖 Usage

`ecsify` offers core ECS concepts without imposing strict rules onto your architecture:

- **Entities** are numerical IDs representing game objects
- **Components** are data containers that can follow different storage patterns
- **Systems** are just functions that query and process entities
- **Queries** provide powerful filtering with change detection

For optimal performance:

- Use [Array of Structures (AoS) format](https://en.wikipedia.org/wiki/AoS_and_SoA) for related component properties
- Implement systems as pure functions operating on query results

### Basic Setup

```ts
import { And, createWorld, With } from 'ecsify';

// Define components - no registration needed!
const Position = { x: [], y: [] }; // AoS pattern
const Velocity = { dx: [], dy: [] }; // AoS pattern
const Health = []; // Single value array
const Player = {}; // Marker component

// Create world
const world = createWorld();
```

### Entity Management

```ts
// Create entity
const entity = world.createEntity();

// Destroy entity (removes all components)
world.destroyEntity(entity);
```

### Component Operations

```ts
// Add components
world.addComponent(entity, Position, { x: 100, y: 50 });
world.addComponent(entity, Velocity, { dx: 2, dy: 1 });
world.addComponent(entity, Health, 100);
world.addComponent(entity, Player, true);

// Update components (AoS)
world.updateComponent(entity, Position, { x: 110 });
world.updateComponent(entity, Health, 95);
world.updateComponent(entity, Player, false); // Also removes marker

// Direct updates - mark as changed for reactive queries
Position.x[entity] = 110;
world.markComponentChanged(entity, Position);
Health[entity] = 95;
world.markComponentChanged(entity, Health);

// Remove component
world.removeComponent(entity, Velocity);

// Check component
if (world.hasComponent(entity, Player)) {
	// Entity is a player
}
```

### Querying

```ts
import { Added, And, Changed, Or, Removed, With, Without } from 'ecsify';

// Query entity IDs
const players = world.queryEntities(With(Player));
const moving = world.queryEntities(And(With(Position), With(Velocity)));
const damaged = world.queryEntities(Changed(Health));

// Query with component data
for (const [eid, pos, health] of world.queryComponents([Entity, Position, Health] as const)) {
	console.log(`Entity ${eid} at (${pos.x}, ${pos.y}) with ${health} health`);
}
```

### Game Loop

```ts
function update(deltaTime: number) {
	// Movement system
	for (const [eid, pos, vel] of world.queryComponents([Entity, Position, Velocity] as const)) {
		world.updateComponent(eid, Position, {
			x: pos.x + vel.dx * deltaTime,
			y: pos.y + vel.dy * deltaTime
		});
	}

	// Clear change tracking
	world.flush();
}
```

## 📐 Architecture

### Entity Index

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

### Query System

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

// Query: And(With(Position), With(Velocity)) → withMask = 0b011
// Check: (entityMask & 0b011) === 0b011
entity1: (0b011 & 0b011) === 0b011  ✓ true
entity2: (0b101 & 0b011) === 0b011  ✗ false
```

**Individual Strategy** - Per-filter evaluation for complex queries:

```typescript
// Complex queries like Or(With(Position), Changed(Health))
// Fall back to: filters.some(filter => filter.evaluate(world, eid))
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

### Component Registry

Component management with direct array access, unlimited components via generations, and flexible storage patterns.

#### Component Patterns

```typescript
// Structure of Arrays (SoA) - cache-friendly for bulk operations
const Position = { x: [], y: [] };
Position.x[eid] = 10;
Position.y[eid] = 20;

// Array of Structures (AoS) - good for complete entity data
const Transform = [];
Transform[eid] = { x: 10, y: 20 };

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

#### Why These Decisions?

**Sparse Arrays:** Memory-efficient with large entity IDs - only allocated indices use memory.

**Direct Array Access:** No function call overhead - `Health[eid] = 100` is fastest possible.

**Flexible Patterns:** Physics systems benefit from SoA cache locality, UI systems need complete AoS objects.

**Generations:** JavaScript 32-bit integers limit us to 31 components - generations provide unlimited components.

**Performance:** O(1) operations, 4 bytes per entity per generation, direct memory access.

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
