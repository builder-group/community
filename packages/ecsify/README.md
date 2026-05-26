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
        <img src="https://img.shields.io/npm/dt/ecsify.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

`ecsify` is a TypeScript Entity Component System for games, simulations, and data-heavy runtimes. It keeps entity data in component stores, lets plugins add typed components, resources, events, and app methods, and gives systems fast queries with change tracking when frame-to-frame behavior matters.

- Build frame loops around numeric entities and typed component stores
- Choose structure-of-arrays for hot paths, object arrays for convenience, or marker components for tags
- React to added, changed, and removed components without maintaining side lists
- Compose plugins that add typed `app.c`, `app.r`, events, and app methods
- Use raw registries when a hot path needs tighter control

```ts
import { createApp, createDefaultPlugin, definePlugin, Entity } from 'ecsify';

const movementPlugin = definePlugin({
  name: 'Movement',
  deps: ['Default'],
  components: {
    Position: { x: [] as number[], y: [] as number[] },
    Velocity: { dx: [] as number[], dy: [] as number[] }
  }
});

const app = createApp({
  plugins: [createDefaultPlugin(), movementPlugin] as const,
  systemSets: ['First', 'Update', 'Last', 'Flush']
});

const player = app.createEntity();
app.addComponent(player, app.c.Position, { x: 0, y: 0 });
app.addComponent(player, app.c.Velocity, { dx: 4, dy: 2 });

app.addSystem(
  (currentApp, delta = 1) => {
    for (const [eid, pos, vel] of currentApp.queryComponents([
      Entity,
      currentApp.c.Position,
      currentApp.c.Velocity
    ] as const)) {
      currentApp.updateComponent(eid, currentApp.c.Position, {
        x: pos.x + vel.dx * delta,
        y: pos.y + vel.dy * delta
      });
    }
  },
  { set: 'Update' }
);

app.update(1 / 60);
console.log(app.c.Position.x[player]); // 0.0666...
```

## Install

```bash
npm install ecsify
```

## Usage

Start with an app when you want plugins, systems, resources, events, and typed access to components:

```ts
import { createApp, createDefaultPlugin, definePlugin } from 'ecsify';

const gamePlugin = definePlugin({
  name: 'Game',
  deps: ['Default'],
  components: {
    Health: [] as number[],
    Player: {}
  },
  resources: {
    score: 0
  }
});

const app = createApp({
  plugins: [createDefaultPlugin(), gamePlugin] as const,
  systemSets: ['First', 'Update', 'Last', 'Flush']
});

const player = app.createEntity();
app.addComponent(player, app.c.Player);
app.addComponent(player, app.c.Health, 100);

app.updateResource('score', 10);
```

Use raw registries when you want only the ECS primitives and no app abstraction:

```ts
import { createComponentRegistry, createEntityIndex, createQueryRegistry, With } from 'ecsify';

const entityIndex = createEntityIndex();
const componentRegistry = createComponentRegistry();
const queryRegistry = createQueryRegistry(entityIndex, componentRegistry);

const Position = { x: [] as number[], y: [] as number[] };
const eid = entityIndex.createEntity();

componentRegistry.add(eid, Position, { x: 10, y: 20 });

const moving = queryRegistry.queryEntities(With(Position));
```

## App

### `createApp(config)`

Creates an ECS app from plugins and ordered system sets.

```ts
const app = createApp({
  plugins: [createDefaultPlugin(), gamePlugin] as const,
  systemSets: ['First', 'Update', 'Last', 'Flush']
});
```

| Option       | Description                                      |
| ------------ | ------------------------------------------------ |
| `plugins`    | Plugins installed before the app is returned     |
| `systemSets` | Ordered system groups run by `app.update(delta)` |

The default plugin adds `app.c.Removed`, `markEntityForRemoval(eid)`, and a `Flush` system. That system destroys entities marked with `app.c.Removed`, then calls `app.flush()` to clear frame-based tracking.

### `definePlugin(config)`

Defines a typed plugin. Plugins can contribute components, resources, events, app extension methods, and setup logic.

```ts
const inputPlugin = definePlugin({
  name: 'Input',
  deps: ['Default'],
  resources: {
    input: { jump: false }
  }
});
```

Install plugins in dependency order. A plugin with `deps: ['Input']` must be installed after the `Input` plugin.

## Components

Components are storage references. `ecsify` supports common ECS storage shapes:

```ts
const Position = { x: [] as number[], y: [] as number[] }; // structure of arrays
const Health = [] as number[]; // single array
const Renderable = {} as {}; // marker
const Sprite = [] as { src: string; frame: number }[]; // array of objects
```

Use app helpers to add, update, remove, and check components:

```ts
const eid = app.createEntity();

app.addComponent(eid, app.c.Position, { x: 0, y: 0 });
app.updateComponent(eid, app.c.Position, { x: 12 });
app.hasComponent(eid, app.c.Position);
app.removeComponent(eid, app.c.Position);
```

`updateComponent` marks the component as changed by default. If you mutate component storage directly, call `markComponentChanged(eid, component)` when `Changed(component)` queries should see the update.

## Queries

Use filters to select entities and components:

```ts
import { Added, And, Changed, Entity, Or, Removed, With, Without } from 'ecsify';

app.queryEntities(With(app.c.Player));
app.queryEntities(And(With(app.c.Position), Without(app.c.Removed)));
app.queryEntities(Or(With(app.c.Player), With(app.c.Enemy)));
app.queryEntities(Added(app.c.Player));
app.queryEntities(Changed(app.c.Health));
app.queryEntities(Removed(app.c.Velocity));

for (const [eid, health] of app.queryComponents([Entity, app.c.Health] as const)) {
  console.log(eid, health);
}
```

`queryComponents` returns typed tuples in the same order as the component list. Include `Entity` when the system needs the entity ID.

For structure-of-arrays storage, `queryComponents` returns row value objects such as `{ x, y }`, not live references to the backing arrays. Update through `updateComponent`, or write to arrays directly and call `markComponentChanged(eid, component)` when `Changed(component)` queries should react.

## Resources And Events

Resources hold global state such as input, config, clocks, and score:

```ts
const inputPlugin = definePlugin({
  name: 'Input',
  deps: ['Default'],
  resources: {
    input: { jump: false }
  }
});

const app = createApp({
  plugins: [createDefaultPlugin(), inputPlugin] as const,
  systemSets: ['First', 'Update', 'Last', 'Flush']
});

app.r.input.jump = true;
app.markResourceChanged('input');

if (app.wasResourceChanged('input')) {
  console.log('input changed this frame');
}
```

Events are queued by type and can be read or consumed:

```ts
const combatPlugin = definePlugin({
  name: 'Combat',
  deps: ['Default'],
  events: {
    damage: {} as { entity: number; amount: number }
  }
});

const app = createApp({
  plugins: [createDefaultPlugin(), combatPlugin] as const,
  systemSets: ['First', 'Update', 'Last', 'Flush']
});

const player = app.createEntity();
app.pushEvent('damage', { entity: player, amount: 10 });

for (const event of app.consumeEvent('damage')) {
  console.log(event.data.amount);
}
```

`app.flush()` clears component and resource add/change/remove tracking, plus unread event queues. If you install `createDefaultPlugin()`, include `Flush` in `systemSets` so the default flush system runs every frame.

## Examples

- [Vanilla basic](https://github.com/builder-group/community/tree/develop/examples/ecsify/vanilla/basic)

## FAQ

### When should I use the app API instead of raw registries?

Use the app API for most projects. It gives you plugin composition, typed component access, resources, events, and ordered systems. Use raw registries for isolated hot paths, tests, or experiments where you want direct control over every ECS primitive.

### Do components have to use structure-of-arrays storage?

No. Structure-of-arrays storage is useful for tight loops, but `ecsify` also works with arrays of objects, single arrays, and marker components. Pick the shape that fits the data and update pattern.

### How does change tracking work?

`addComponent`, `updateComponent`, and `removeComponent` update the frame-tracking state automatically. Direct mutations are allowed, but you need to call `markComponentChanged` when `Changed(component)` queries should react to them.

### What is the difference between `Removed(component)` and `app.c.Removed`?

`Removed(component)` is a query filter for components removed earlier in the current frame. `app.c.Removed` is the marker component added by the default plugin for whole-entity removal. Call `markEntityForRemoval(eid)` to add that marker, then the default `Flush` system destroys the entity.

### Are entity IDs recycled?

Yes. The app uses `createEntityIndex()` with recycled numeric IDs by default. Use the raw `createEntityIndex({ versioning: true })` API when stale entity references need versioned IDs.

### How does it compare to bitecs, koota, becsy, and elics?

`ecsify` focuses on a TypeScript-first app model with plugins, typed app contributions, flexible component storage, and query filters. Use it when you want ECS primitives that can stay low-level, but still compose into a typed application API.
