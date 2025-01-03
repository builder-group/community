<h1 align="center">
  <img src="https://raw.githubusercontent.com/builder-group/community/develop/packages/google-webfonts-client/.github/banner.svg" alt="google-webfonts-client banner">
</h1>

<p align="left">
    <a href="https://github.com/builder-group/community/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/builder-group/community.svg?label=license&style=flat&colorA=293140&colorB=FDE200" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/google-webfonts-client">
        <img src="https://img.shields.io/bundlephobia/minzip/google-webfonts-client.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=FDE200" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/google-webfonts-client">
        <img src="https://img.shields.io/npm/dt/google-webfonts-client.svg?label=downloads&style=flat&colorA=293140&colorB=FDE200" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/w4xE3bSjhQ">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=000000&color=293140&labelColor=FDE200" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`google-webfonts-client` is a typesafe and straightforward fetch client for interacting with the Google Web Fonts API using [`feature-fetch`](https://github.com/builder-group/community/tree/develop/packages/feature-fetch). This client provides typesafe methods for fetching and downloading Google Fonts.

- [Google Fonts Developer API Docs](https://developers.google.com/fonts/docs/developer_api)

## 📖 Usage

### Create a Google Web Fonts Client

Use `createGoogleWebfontsClient()` to create a client with your API key.

```ts
import { createGoogleWebfontsClient } from 'google-webfonts-client';

const client = createGoogleWebfontsClient({
	apiKey: 'YOUR_API_KEY'
});
```

### Fetch Available Web Fonts

Fetches the available web fonts from the Google Fonts API.

```ts
const webFontsResult = await client.getWebFonts();
const webFonts = webFontsResult.unwrap();
```

### Fetch Font File URL

Fetches the URL of a specific font file based on the provided family, weight, and style.

```ts
const fontUrlResult = await client.getFontFileUrl('Roboto Serif', {
	fontWeight: 400,
	fontStyle: 'regular'
});
const fontUrl = fontUrlResult.unwrap();
```

### Download a Font File

Use the client to download a font file, specifying the font family, weight, and style.

```ts
const fontFileResult = await client.downloadFontFile('Roboto Serif', {
	fontWeight: 100,
	fontStyle: 'italic'
});
const fontFile = fontFileResult.unwrap();
```

### Error Handling

Errors can occur during API requests, and the client will return detailed error information. Possible error types include:

- **`NetworkError`**: Indicates a failure in network communication, such as loss of connectivity
- **`RequestError`**: Occurs when the server returns a response with a status code indicating an error (e.g., 4xx or 5xx)
- **`FetchError`**: A general exception type that can encompass other error scenarios not covered by `NetworkError` or `RequestError`, for example when the response couldn't be parsed, ..

```ts
const fontUrlResult = await client.getFontFileUrl('Roboto Serif', {
	fontWeight: 400,
	fontStyle: 'regular'
});

// First Approach: Handle error using `isErr()`
if (fontUrlResult.isErr()) {
	const { error } = fontUrlResult;
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
	const fontUrl = fontUrlResult.unwrap();
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
