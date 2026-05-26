/** Converts an OpenAPI path (`/pets/{id}`) to router path syntax (`/pets/:id`). */
export function formatOpenApiPath(path: string): string {
	return path.replace(/\{([^{}]+)\}/g, ':$1');
}
