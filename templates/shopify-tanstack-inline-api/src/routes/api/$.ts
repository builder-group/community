import { createFileRoute } from '@tanstack/react-router';
import { createApi } from '@/api';

const api = createApi();

export const Route = createFileRoute('/api/$')({
	server: {
		handlers: {
			ANY: ({ request }) => api.request(removeApiPrefix(request))
		}
	}
});

// Keep Hono paths deployment-neutral; `/api` is only the same-origin TanStack mount point
function removeApiPrefix(request: Request): Request {
	const url = new URL(request.url);
	url.pathname = url.pathname.replace(/^\/api/, '') || '/';

	return new Request(url, request);
}
