import { createFileRoute } from '@tanstack/react-router';
import type { createApi } from '@template/api-shopify-hono';
import { apiConfig } from '@/environment/configs/api.config.server';

export const Route = createFileRoute('/api/$')({
	server: {
		handlers: {
			ANY: ({ request }) => handleApiRequest(request)
		}
	}
});

async function handleApiRequest(request: Request): Promise<Response> {
	if (apiConfig.proxyUrl != null) {
		return proxyApiRequest(request, apiConfig.proxyUrl);
	}

	const api = await getEmbeddedApi();
	return api.request(removeApiPrefix(request));
}

async function proxyApiRequest(request: Request, proxyUrl: URL): Promise<Response> {
	const requestUrl = new URL(request.url);
	const targetUrl = new URL(proxyUrl);
	targetUrl.pathname = `${targetUrl.pathname.replace(/\/$/, '')}${getApiPath(requestUrl.pathname)}`;
	targetUrl.search = requestUrl.search;

	return fetch(new Request(targetUrl, request));
}

// Note: Hono owns root-relative routes, so remove TanStack's `/api` mount prefix
function removeApiPrefix(request: Request): Request {
	const url = new URL(request.url);
	url.pathname = getApiPath(url.pathname);

	return new Request(url, request);
}

function getApiPath(pathname: string): string {
	return pathname.replace(/^\/api(?=\/|$)/, '') || '/';
}

async function getEmbeddedApi(): Promise<TEmbeddedApi> {
	if (embeddedApi != null) {
		return embeddedApi;
	}

	const apiModule = await import('@template/api-shopify-hono');
	embeddedApi ??= apiModule.createApi();
	return embeddedApi;
}

let embeddedApi: TEmbeddedApi | null = null;

type TEmbeddedApi = ReturnType<typeof createApi>;
