### **Rules for Natural Widget Flow in Widget Grid**
1. **No Resize of Widgets:** Widget sizes remain fixed
2. **Flow Priority:** Empty spaces (`null`) are filled starting from the top-left corner, but only adjacent widgets move to fill gaps
3. **Minimal Changes:** Widgets move or swap only when necessary, minimizing disruption to the grid
4. **Preservation of Structure:** The grid layout remains consistent, with no overlaps or resizing

#### **Example 1: Swapping a 2x2 Widget**
Before:  
```javascript
// [  'X',  'X',  'B'],
// [  'X',  'X',  'C'],
// [ null, null,  'D']
```

After:  
```javascript
// [ null, null,  'B'],
// [  'X',  'X',  'C'],
// [  'X',  'X',  'D']
```
