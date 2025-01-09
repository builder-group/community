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

#### Data Structure Comparison

**Grid-Based Layout** (Current):
```ts
{
    // O(1) access to any cell
    grid: [
        ['1', '1', '2'],
        ['1', '1', '2']
    ],
    // O(1) access to widget data
    items: {
        '1': { id: '1' },
        '2': { id: '2' }
    }
}
```

**Item-Based Positioning** (Alternative):
```ts
{
    // O(1) access to widget data
    items: [
        { 
            id: '1',
            x: 0, // Requires collision detection
            y: 0,
            width: 2,
            height: 2
        },
        { id: '2', x: 2, y: 0, width: 1, height: 2 }
    ]
}
```

#### Key Advantages of Grid-Based Layout

1. **Performance Characteristics**
   - **Grid Operations**: O(n) where n = cells in affected region
   - **Partial Updates**: Only recompute affected grid areas
   - **Initial Load**: Can render skeleton layout immediately (and load visible widgets first)
   - **Memory**: Compact representation of layout

2. **Safety & Validation**
   - Grid structure prevents invalid states by design
   - Implicit validation through grid structure
   - Predictable widget boundaries

3. **Developer Experience**
   - Visual representation matches code structure
   - Clear separation of layout and widget data

#### When to Choose Item-Based?

Consider item-based positioning when you need:
- Free-form layouts without grid constraints
- Complex widget interactions (rotation, scaling)

If its not structured and predictable, you should use item-based positioning.

#### Why Grid-Based Works for Us

- Structured, predictable layouts
- High performance with many widgets (since it's basically a list of widgets)