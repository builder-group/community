import { createFileRoute } from '@tanstack/react-router';
import { createApi } from '@template/api-shopify-hono';

const api = createApi();

export const Route = createFileRoute('/api/$')({
	server: {
		handlers: {
			ANY: ({ request }) => api.request(removeApiPrefix(request))
		}
	}
});

// Note: Hono owns root-relative routes, so remove TanStack's `/api` mount prefix
function removeApiPrefix(request: Request): Request {
	const url = new URL(request.url);
	url.pathname = url.pathname.replace(/^\/api/, '') || '/';

	return new Request(url, request);
}
