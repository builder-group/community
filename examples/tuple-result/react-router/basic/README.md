# Tuple Result + React Router Example

This example demonstrates how to use `tuple-result` with React Router v7 loaders for clean, serializable error handling.

## Key Features

- **Single Comprehensive Example**: Shows both success and error handling in one place
- **Serialization**: Demonstrates `toArray()` for React Router compatibility
- **Clean DX**: No more `.value` or `.error` boilerplate

## How It Works

1. **Loader returns serialized result**: Uses `result.toArray()` for React Router compatibility
2. **Component destructures directly**: `const [ok, error, value] = useLoaderData()`
3. **Conditional rendering**: Clean if/else based on `ok` flag

## Code Example

```ts
import { Ok, Err } from 'tuple-result';

export async function loader() {
  if (Math.random() < 0.3) {
    return Err(new Error('Request failed')).toArray();
  }
  return Ok({ name: 'John Doe', email: 'john@example.com' }).toArray();
}

export default function Component() {
  const [ok, error, value] = useLoaderData<typeof loader>();

  if (ok) {
    return <div>Success: {value.name}</div>;
  } else {
    return <div>Error: {error.message}</div>;
  }
}
```

## Benefits

- **Serializable**: Works with React Router loaders out of the box
- **Type Safe**: Full TypeScript support with discriminated unions
- **Lightweight**: Core is just ~150B
- **Clean DX**: Array destructuring eliminates boilerplate

## Running

```bash
npm run dev
```

Navigate to `/loader-basic` to see the complete example.
