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
