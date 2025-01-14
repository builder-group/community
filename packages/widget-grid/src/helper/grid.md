## Grid Flow

### Strategies

#### 1. Drop-Replace Strategy
A basic drag-and-drop strategy - place the region wherever it's dropped and leave an empty space behind.

**Rules:**
1. Region is placed directly at the target position, regardless of what's there
2. Original position becomes empty
3. No cascading effects on other regions
4. Allows creation of gaps in the grid

*Example:* Move A from [0,0] to [1,0]
```js
[A, B, C]  ->  [-, A, C]
[D, E, F]      [D, E, F]
[G, H, I]      [G, H, I]
```

#### 2. Swap-Cascade Strategy
A movement strategy that prefers swapping positions while allowing upward movement into empty spaces.

**Rules:**
1. Prefers swapping with existing regions when possible
2. Moves regions upward to fill empty spaces above
3. Does not pull regions sideways to fill gaps
4. Maintains vertical connectivity
5. May create horizontal gaps

*Example:* Move A from [0,0] to [1,1]
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [G, A, F]
[G, H, I]      [-, E, I]
               [-, H, -]
```

#### 3. Swap-Pull Strategy
An advanced strategy that combines swapping with a gravitational pull toward the top-left corner.

**Rules:**
1. Initially behaves like Swap-Cascade to handle movement
2. After movement, applies a pulling force toward the top-left
3. Fills gaps by pulling regions up and left
4. Maintains grid density by eliminating isolated gaps
5. Ensures most compact arrangement possible

*Example:* Move A from [0,0] to [1,1]
```js
[A, B, C]  ->  [D, B, C]  ->  [D, B, C]
[D, E, F]      [G, A, F]      [G, A, F]
[G, H, I]      [-, E, I]      [E, I, -]
               [-, H, -]      [H, -, -]
```

### Movement Examples

#### **Example 1: Move A from [0, 0] to [1, 0]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, A, C]
[D, E, F]      [D, E, F]
[G, H, I]      [G, H, I]
```
*Strategy:* `swap-cascade` & `swap-pull`
```js
[A, B, C]  ->  [B, A, C]
[D, E, F]      [D, E, F]
[G, H, I]      [G, H, I]
```

#### **Example 2: Move A from [0, 0] to [2, 0]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, C, A]
[D, E, F]      [D, E, F]
[G, H, I]      [G, H, I]
```
*Strategy:* `swap-cascade` & `swap-pull`
```js
[A, B, C]  ->  [B, C, A]
[D, E, F]      [D, E, F]
[G, H, I]      [G, H, I]
```

#### **Example 3: Move A from [0, 0] to [0, 1]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, B, C]
[D, E, F]      [A, E, F]
[G, H, I]      [G, H, I]
```
*Strategy:* `swap-cascade` & `swap-pull`
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [A, E, F]
[G, H, I]      [G, H, I]
```

#### **Example 4: Move A from [0, 0] to [0, 2]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, B, C]
[D, E, F]      [G, E, F]
[G, H, I]      [A, H, I]
```
*Strategy:* `swap-cascade` & `swap-pull`
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [G, E, F]
[G, H, I]      [A, H, I]
```

#### **Example 5: Move A from [0, 0] to [1, 1]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, B, C]
[D, E, F]      [D, A, F]
[G, H, I]      [G, H, I]
```
*Strategy:* `swap-cascade`
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [G, A, F]
[G, H, I]      [-, E, I]
               [-, H, -]
```
*Strategy:* `swap-pull`
```js
[A, B, C]  ->  [D, B, C] -> [D, B, C]
[D, E, F]      [G, A, F]    [G, A, F]
[G, H, I]      [-, E, I]    [E, I, -]
               [-, H, -]    [H, -, -]
```

#### **Example 6: Move A from [0, 0] to [2, 2]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, B, C]
[D, E, F]      [D, E, F]
[G, H, I]      [G, H, A]
```
*Strategy:* `swap-cascade`
```js
[A, B, C]  ->  [D, B, C]
[D, E, F]      [G, E, F]
[G, H, I]      [-, H, A]
               [-, -, I]
```
*Strategy:* `swap-pull`
```js
[A, B, C]  ->  [D, B, C] -> [D, B, C]
[D, E, F]      [G, E, F]    [G, E, F]
[G, H, I]      [-, H, A]    [H, I, -]
               [-, -, I]    [A, -, -]
```

### 8x 1x1 & 1x 1x2 Widget Grid Examples

#### **Example 1: Move A from [0, 0] to [1, 0]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, A, C]
[A, D, E]      [-, A, E]
[F, G, H]      [F, G, H]
```
*Strategy:* `swap-cascade` & `swap-pull`
```js
[A, B, C]  ->  [B, A, C]
[A, D, E]      [D, A, E]
[F, G, H]      [F, G, H]
```

#### **Example 2: Move A from [0, 0] to [2, 0]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, C, A]
[A, D, E]      [-, E, A]
[F, G, H]      [F, G, H]
```
*Strategy:* `swap-cascade` & `swap-pull`
```js
[A, B, C]  ->  [B, C, A]
[A, D, E]      [D, E, A]
[F, G, H]      [F, G, H]
```

#### **Example 3: Move A from [0, 0] to [0, 1]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, B, C]
[A, D, E]      [A, D, E]
[F, G, H]      [A, G, H]
```
*Strategy:* `swap-cascade` & `swap-pull`
```js
[A, B, C]  ->  [F, B, C]
[A, D, E]      [A, D, E]
[F, G, H]      [A, G, H]
```

#### **Example 4: Move A from [0, 0] to [0, 2]**
*Strategy:* `drop-replace`
```js
[A, B, C]  ->  [-, B, C]
[A, D, E]      [-, D, E]
[F, G, H]      [A, G, H]
               [A, -, -]
```
*Strategy:* `swap-cascade`
```js
[A, B, C]  ->  [F, B, C]
[A, D, E]      [-, D, E]
[F, G, H]      [A, G, H]
               [A, -, -]
```
*Strategy:* `swap-pull`
```js
[F, B, C]  ->  [F, B, C]  ->  [F, B, C]
[-, D, E]      [D, E, -]      [D, E, H]
[A, G, H]      [A, G, H]      [A, G, -]
[A, -, -]      [A, -, -]      [A, -, -]
```