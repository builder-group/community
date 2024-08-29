<h1 align="center">
  <img src="https://raw.githubusercontent.com/builder-group/monorepo/develop/packages/eprel-client/.github/banner.svg" alt="eprel-client banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/eprel-client">
        <img src="https://img.shields.io/bundlephobia/minzip/eprel-client.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/eprel-client">
        <img src="https://img.shields.io/npm/dt/eprel-client.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`eprel-client` is a typesafe and straightforward fetch client for interacting  with the European Product Registry for Energy Labelling (EPREL) API using [`feature-fetch`](https://github.com/builder-group/monorepo/tree/develop/packages/feature-fetch). 

- [EPREL API Docs](https://webgate.ec.europa.eu/fpfis/wikis/display/EPREL/EPREL+Public+site+-+API)

## 📖 Usage

### Create a EPREL Client

Use `createEPRELClient()` to create a client with your API key.

```ts
import { createEPRELClient } from 'eprel-client';

const client = createEPRELClient({
  apiKey: 'YOUR_API_KEY'
});
```

### Fetch Available Product Groups

Fetches the available product groups from the ERAP API.

```ts
const productGroupsResult = await client.getProductGroups();
const productGroups = productGroupsResult.unwrap();
```

### Error Handling

Errors can occur during API requests, and the client will return detailed error information. Possible error types include:

- **`NetworkError`**: Indicates a failure in network communication, such as loss of connectivity
- **`RequestError`**: Occurs when the server returns a response with a status code indicating an error (e.g., 4xx or 5xx)
- **`FetchError`**: A general exception type that can encompass other error scenarios not covered by `NetworkError` or `RequestError`, for example when the response couldn't be parsed, ..

```ts
const productGroupsResult = await client.getProductGroups();

// First Approach: Handle error using `isErr()`
if (productGroupsResult.isErr()) {
  const { error } = productGroupsResult;
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof RequestError) {
    console.error('Request error:', error.message, 'Status:', error.status);
  } else if (error instanceof FetchError) {
    console.error('Service error:', error.message, 'Code:', error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}

// Second Approach: Unwrap response with `try-catch`
try {
  const productGroups = productGroupsResult.unwrap();
} catch (error) {
  if (error instanceof NetworkError) {
    console.error('Network error:', error.message);
  } else if (error instanceof RequestError) {
    console.error('Request error:', error.message, 'Status:', error.status);
  } else if (error instanceof FetchError) {
    console.error('Service error:', error.message, 'Code:', error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}

```