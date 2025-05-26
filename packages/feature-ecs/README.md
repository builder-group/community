# feature-ecs

TODO

## Entity Index

The entity index provides efficient entity ID management with optional versioning support using a sparse-dense array pattern. This component handles O(1) entity operations while maintaining cache-friendly iteration.

### Architecture Overview

The entity index uses a **sparse-dense array pattern** that provides O(1) operations while maintaining cache-friendly iteration:

```
Sparse Array:  [_, 0, _, 2, 1, _, _]  ← Maps entity ID → dense index
                 1  2  3  4  5  6  7   ← Entity IDs

Dense Array:   [2, 5, 4, 7, 3]        ← Alive entities (cache-friendly)
               [0, 1, 2, 3, 4]        ← Indices
               └─ alive ─┘ └ dead ┘

aliveCount: 3  ← First 3 elements are alive
```

#### Core Data Structures

1. **Sparse Array** (`_sparse`): Maps base entity IDs to their position in the dense array
2. **Dense Array** (`dense`): Contiguous array of entity IDs, split into alive and dead sections
3. **Alive Count** (`aliveCount`): Boundary between alive and dead entities in dense array

#### Entity ID Format (with versioning)

```
32-bit Entity ID = [Version Bits | Entity ID Bits]

Example with 8 version bits:
┌─ Version (8 bits) ─┐┌─── Entity ID (24 bits) ───┐
00000001              000000000000000000000001
│                     │
└─ Version 1          └─ Base Entity ID 1
```

### Why This Architecture?

#### 1. **Performance Requirements**

ECS systems need to handle thousands of entities efficiently in game loops that run 60+ times per second.

**Our solution:**

- **O(1) entity creation/removal**: No searching or shifting arrays
- **Cache-friendly iteration**: Dense array keeps alive entities contiguous
- **Minimal memory allocation**: Recycles entity IDs instead of growing indefinitely

#### 2. **Memory Safety with Versioning**

Without versioning, stale entity references can cause bugs:

```typescript
const enemy = entityIndex.addEntity();
const enemyRef = enemy; // Store reference

// Later...
entityIndex.removeEntity(enemy);
const newEntity = entityIndex.addEntity(); // Might reuse same ID!

// BUG: enemyRef might accidentally refer to newEntity
if (entityIndex.isEntityAlive(enemyRef)) {
	// This could be true for the wrong entity!
}
```

**Our solution with versioning:**

```typescript
const enemy = entityIndex.addEntity(); // Returns ID with version 0
entityIndex.removeEntity(enemy); // Increments version to 1
const newEntity = entityIndex.addEntity(); // Reuses base ID but with version 1

// Safe: old reference (version 0) won't match new entity (version 1)
entityIndex.isEntityAlive(enemy); // false - version mismatch
```

#### 3. **Swap-and-Pop for Efficient Removal**

Traditional array removal requires shifting elements (O(n)):

```typescript
// Traditional approach - O(n)
array = [1, 2, 3, 4, 5];
array.splice(1, 1); // Remove element at index 1
// Result: [1, 3, 4, 5] - had to shift 3 elements
```

Our swap-and-pop approach achieves O(1) removal:

```typescript
// Our approach - O(1)
dense = [1, 2, 3, 4, 5];
// Remove element at index 1:
// 1. Swap with last element: [1, 5, 3, 4, 2]
// 2. Decrease alive count: aliveCount = 4
// Result: [1, 5, 3, 4 | 2] - only alive section matters
```

#### 4. **Configurable Bit Allocation**

Different applications have different needs:

```typescript
// Game with many short-lived entities (bullets, particles)
versionBits: 12; // 4096 versions, ~1M entities max

// Simulation with fewer, long-lived entities
versionBits: 4; // 16 versions, ~256M entities max
```

### Performance Characteristics

| Operation     | Time Complexity            | Space Complexity |
| ------------- | -------------------------- | ---------------- |
| Add Entity    | O(1)                       | O(1)             |
| Remove Entity | O(1)                       | O(1)             |
| Check Alive   | O(1)                       | O(1)             |
| Iterate Alive | O(n) where n = alive count | O(1)             |

**Memory Usage:**

- Sparse array: 4 bytes × max entities ever created
- Dense array: 4 bytes × max entities ever created
- Total: ~8 bytes per entity slot

**Cache Performance:**

- Iteration over alive entities is cache-friendly (contiguous memory)
- Sparse lookups may cause cache misses but are O(1)
