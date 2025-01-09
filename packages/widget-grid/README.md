<h1 align="center">
    <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/widget-grid/.github/banner.svg" alt="widget-grid banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/widget-grid">
        <img src="https://img.shields.io/bundlephobia/minzip/widget-grid.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/widget-grid">
        <img src="https://img.shields.io/npm/dt/widget-grid.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`widget-grid` ...

### ⚠️ WIP
- [ ] Have breakpoints where the grid gets resizes (with nice animation)
- [ ] Framework agnostic

```tsx
const _grid = [
	['i1', 'i1', 'i2'],
	['i1', 'i1', 'i3'],
	['i4', 'i4', 'i3']
];

const _items = {
	i1: { id: 'i1' },
	i2: { id: 'i2' },
	i3: { id: 'i3' },
	i4: { id: 'i4' },
};

return (
    <div>
        <div widget-grid-id="i1">i1</div>
        <div widget-grid-id="i2">i2</div>
        <div widget-grid-id="i3">i3</div>
        <div widget-grid-id="i4">i4</div>
    </div>
);
```

### 📚 Examples

- [ReactJs Basic](https://github.com/builder-group/community/tree/develop/examples/widget-grid/react/basic)

## 📖 Usage

```ts
```

## 💡 Resources / References

- [Bento.me](https://bento.me)
- [Swapy](https://swapy.tahazsh.com/)
- [Moving Bento Grid](https://github.com/manish-basargekar/moving-bento-grid)
- [A New Drag And Drop Library For EVERY Framework](https://www.youtube.com/watch?v=gaNLnuwoFRI)

## ❓ FAQ

### Why use a grid-based layout instead of item-based positioning?

We opted for a **grid-based layout** over an **item-based positioning** approach due to its simplicity, performance, and ease of maintenance.

#### **Grid-Based Layout** (Current Approach):
```ts
{
    grid: [
        ['1', '1', '2'],
        ['1', '1', '2']
    ],
    items: {
        '1': { id: '1' },
        '2': { id: '2' }
    }
}
```

#### **Item-Based Positioning** (Alternative Approach):
```ts
{
    items: {
        '1': { id: '1', x: 0, y: 0, width: 2, height: 2 },
        '2': { id: '2', x: 2, y: 0, width: 1, height: 2 }
    }
}
```

#### Key Advantages of the Grid-Based Layout

#### 1. **Performance**
- **Grid-based**: Operations are O(n), where **n** is the number of cells in the affected region
- **Item-based**: Operations are O(m), where **m** is the number of widgets, due to collision checks
- Grid layouts efficiently compute regions and re-render only the affected areas

#### 2. **Safety**
- Invalid states (e.g., overlapping widgets) are **impossible by design** in a grid-based layout
- The grid ensures integrity, making moves and resizes straightforward and safe

#### 3. **Operational Simplicity**
- **Grid-based**:
  - Drag: Simple cell swapping
  - Resize: Direct cell updates in the grid
  - Insert: Clear allocation of cells
  - No need for complex collision resolution
- **Item-based**:
  - Requires collision detection and resolution logic, increasing complexity

#### 4. **Maintainability**
- The grid serves as a **single source of truth**
- Predictable state management ensures debugging is straightforward

#### Common Operations Comparison

#### **Grid-Based Layout**
```ts
function handleDrag(fromPos, toPos) {
    // 1. Get affected region
    const range = getAffectedRange(fromPos, toPos);
    
    // 2. Get current layout in that region
    const regions = getWidgetRegions(grid, range);
    
    // 3. Calculate new positions
    moveWidget(grid, fromPos, toPos);
    
    // 4. Only re-render affected area
    updateRegion(range);
}
```

#### **Item-Based Positioning**
```ts
function handleDrag(widgetId, newPos) {
    // 1. Find all affected widgets
    const affectedWidgets = findCollisions(items[widgetId], newPos);
    
    // 2. Calculate new positions for all affected widgets
    const movements = calculateMovements(affectedWidgets, newPos);
    
    // 3. Validate final positions
    if (!isValidLayout(movements)) return;
    
    // 4. Update positions and re-render affected widgets
    applyMovements(movements);
}
```

#### When to Consider Item-Based Positioning?

While the grid-based approach is ideal for strict layouts and predictable behaviors, the item-based positioning approach is better suited for:
- **Free-form layouts**: Where widgets can be placed freely without a strict grid structure
- **Advanced features**: Such as rotation or non-rectangular shapes

#### Why We Lean Towards the Grid-Based Layout

The grid-based layout excels in scenarios where performance, simplicity, and maintainability are priorities. It provides:
- **Consistent behavior** for core features (drag, resize, insert)
- **High efficiency** with minimal computational overhead
- **A safer structure** that avoids invalid states and complex validation logic