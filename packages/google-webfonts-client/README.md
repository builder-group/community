<h1 align="center">
  <img src="./.github/banner.svg" alt="google-webfonts-client banner">
</h1>

<p align="left">
    <a href="https://github.com/inbeta-group/monorepo/blob/develop/LICENSE">
        <img src="https://img.shields.io/github/license/inbeta-group/monorepo.svg?label=license&style=flat&colorA=293140&colorB=F0E81A" alt="GitHub License"/>
    </a>
    <a href="https://www.npmjs.com/package/google-webfonts-client">
        <img src="https://img.shields.io/bundlephobia/minzip/google-webfonts-client.svg?label=minzipped%20size&style=flat&colorA=293140&colorB=F0E81A" alt="NPM bundle minzipped size"/>
    </a>
    <a href="https://www.npmjs.com/package/google-webfonts-client">
        <img src="https://img.shields.io/npm/dt/google-webfonts-client.svg?label=downloads&style=flat&colorA=293140&colorB=F0E81A" alt="NPM total downloads"/>
    </a>
    <a href="https://discord.gg/T9GzreAwPH">
        <img src="https://img.shields.io/discord/795291052897992724.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=F0E81A" alt="Join Discord"/>
    </a>
</p>

> Status: Experimental

`google-webfonts-client` is a typesafe and straightforward fetch client for interacting with the Google Web Fonts API using [`feature-fetch`](https://github.com/inbeta-group/monorepo/tree/develop/packages/feature-fetch). This client provides typesafe methods for fetching and downloading Google Fonts.

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
const fontsResponse = await client.getWebFonts();

if (fontsResponse.isOk()) {
    console.log('Available fonts:', fontsResponse.value.data.items);
} else {
    console.error('Error fetching fonts:', fontsResponse.error.message);
}
```

### Fetch Font File URL

Fetches the URL of a specific font file based on the provided family, weight, and style.

```ts
const urlResponse = await client.getFontFileUrl('Roboto Serif', {
    fontWeight: 400,
    fontStyle: 'regular'
});

if (urlResponse.isOk()) {
    const fontUrl = urlResponse.value;
    console.log('Font URL:', fontUrl);
} else {
    console.error('Error fetching font URL:', urlResponse.error.message);
}
```

### Download a Font File

Use the client to download a font file, specifying the font family, weight, and style.

```ts
const fileResponse = await client.downloadFontFile('Roboto Serif', {
    fontWeight: 100,
    fontStyle: 'italic'
});

if (fileResponse.isOk()) {
    const fontFile = fileResponse.value;
    console.log('Font file downloaded:', fontFile);
} else {
    console.error('Error downloading font file:', fileResponse.error.message);
}
```

### Error Handling

Errors can occur during API requests, and the client will return detailed error information. Possible error types include:

- **`NetworkException`**: Indicates a failure in network communication, such as loss of connectivity
- **`RequestException`**: Occurs when the server returns a response with a status code indicating an error (e.g., 4xx or 5xx)
- **`ServiceException`**: A general exception type that can encompass other error scenarios not covered by `NetworkException` or `RequestException`, for example when the response couldn't be parsed, ..

```ts
try {
  const data = urlResponse.unwrap();
  console.log(data);
} catch (error) {
  if (error instanceof NetworkException) {
    console.error('Network error:', error.message);
  } else if (error instanceof RequestException) {
    console.error('Request error:', error.message, 'Status:', error.status);
  } else if (error instanceof ServiceException) {
    console.error('Service error:', error.message, 'Code:', error.code);
  } else {
    console.error('Unexpected error:', error);
  }
}
```