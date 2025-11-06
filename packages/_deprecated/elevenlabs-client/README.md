<h1 align="center">
  <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/elevenlabs-client/.github/banner.svg" alt="elevenlabs-client banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/elevenlabs-client">
        <img src="https://img.shields.io/bundlephobia/minzip/elevenlabs-client.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/elevenlabs-client">
        <img src="https://img.shields.io/npm/dt/elevenlabs-client.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`elevenlabs-client` is a typesafe and straightforward fetch client for interacting with the ElevenLabs API using [`feature-fetch`](https://github.com/builder-group/community/tree/develop/packages/feature-fetch).

- [ElevenLabs API Docs](https://elevenlabs.io/docs/introduction)
- [OpenAPI](https://github.com/elevenlabs/elevenlabs-docs/blob/main/openapi.json)

## 📖 Usage

### 🌟 Motivation

Create an ElevenLabs API client that works in a [Remotion](https://www.remotion.dev/) (ReactJs) environment.

### ⚖️ Alternatives

- [elevenlabs-js](https://github.com/elevenlabs/elevenlabs-js)

### Create an ElevenLabs Client

Use `createElvenLabsClient()` to create a client with your API key.

```ts
import { createElvenLabsClient } from 'elevenlabs-client';

const client = createElvenLabsClient({
	apiKey: 'YOUR_API_KEY'
});
```

### Error Handling

Errors can occur during API requests, and the client will return detailed error information. Possible error types include:

- **`NetworkError`**: Indicates a failure in network communication, such as loss of connectivity
- **`RequestError`**: Occurs when the server returns a response with a status code indicating an error (e.g., 4xx or 5xx)
- **`FetchError`**: A general exception type that can encompass other error scenarios not covered by `NetworkError` or `RequestError`, for example when the response couldn't be parsed, ..

```ts
const voicesResult = await client.getVoices();

// First Approach: Handle error using `isErr()`
if (voicesResult.isErr()) {
	const { error } = voicesResult;
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
	const voices = voicesResult.unwrap();
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
