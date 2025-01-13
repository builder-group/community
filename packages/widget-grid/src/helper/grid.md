## **Rules for Natural Widget Flow in Widget Grid**
1. **No Resize of Widgets:** Widget sizes remain fixed
2. **Flow Priority:** Empty spaces (`null`) are filled starting from the top-left corner, but only adjacent widgets move to fill gaps
3. **Minimal Changes:** Widgets move or swap only when necessary, minimizing disruption to the grid
4. **Preservation of Structure:** The grid layout remains consistent, with no overlaps or resizing

// [x, y]

### **Example 1: Move A from [0, 0] to [1, 0]**
Strategy: Rearrange-Simple & Rearrange-Pull
```js
[A, B, C]  ->  [B, A, C]
[D, E, F]      [D, E, F]
[G, H, I]      [G, H, I]
```

### **Example 2: Move A from [0, 0] to [2, 0]**
Strategy: Rearrange-Simple & Rearrange-Pull
```js
[A, B, C]  ->  [B, C, A]
[D, E, F]      [D, E, F]
[G, H, I]      [G, H, I]
```

### **Example 3: Move A from [0, 0] to [0, 1]**
Strategy: Rearrange-Simple & Rearrange-Pull
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [A, E, F]
[G, H, I]      [G, H, I]
```

### **Example 4: Move A from [0, 0] to [0, 2]**
Strategy: Rearrange-Simple & Rearrange-Pull
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [G, E, F]
[G, H, I]      [A, H, I]
```

### **Example 5: Move A from [0, 0] to [1, 1]**
Strategy: Rearrange-Simple 
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [G, A, F]
[G, H, I]      [-, E, I]
               [-, H, -]
```
Strategy: Rearrange-Pull
```js
[A, B, C]  ->  [D, B, C] -> [D, B, C]
[D, E, F]      [G, A, F]    [G, A, F]
[G, H, I]      [-, E, I]    [E, I, -]
               [-, H, -]    [H, -, -]
```

### **Example 6: Move A from [0, 0] to [2, 2]**
Strategy: Rearrange-Simple 
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [G, E, F]
[G, H, I]      [-, H, A]
               [-, -, I]
```
Strategy: Rearrange-Pull
```js
[A, B, C]  ->  [D, B, C] -> [D, B, C]
[D, E, F]      [G, E, F]    [G, E, F]
[G, H, I]      [-, H, A]    [H, I, -]
               [-, -, I]    [A, -, -]
```

---

### **8x 1x1 & 1x 1x2 Widget Grid Examples**

#### **Example 1: Move A from [0, 0] to [1, 0]**
Strategy: Rearrange-Simple & Rearrange-Pull
```js
[A, B, C]  ->  [B, A, C]
[A, D, E]      [D, A, E]
[F, G, H]      [F, G, H]
```

#### **Example 2: Move A from [0, 0] to [2, 0]**
Strategy: Rearrange-Simple & Rearrange-Pull
```js
[A, B, C]  ->  [B, C, A]
[A, D, E]      [D, E, A]
[F, G, H]      [F, G, H]
```

#### **Example 3: Move A from [0, 0] to [0, 1]**
Strategy: Rearrange-Simple & Rearrange-Pull
```js
[A, B, C]  ->  [F, B, C]
[A, D, E]      [A, D, E]
[F, G, H]      [A, G, H]
```

#### **Example 4: Move A from [0, 0] to [0, 2]**
Strategy: Rearrange-Simple 
```js
[A, B, C]  ->  [F, B, C]
[A, D, E]      [-, D, E]
[F, G, H]      [A, G, H]
               [A, -, -]
```
Strategy: Rearrange-Pull
```js
[F, B, C]  ->  [F, B, C]  ->  [F, B, C]
[-, D, E]      [D, E, -]      [D, E, H]
[A, G, H]      [A, G, H]      [A, G, -]
[A, -, -]      [A, -, -]      [A, -, -]
```
