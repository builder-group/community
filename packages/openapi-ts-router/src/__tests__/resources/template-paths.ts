/** OpenAPI paths whose templates need escaping or segment splitting in router syntax. */
export interface TTemplatePaths {
	'/items/{item-id}': { get: TTemplateOperation };
	'/files/{name}.{ext}': { get: TTemplateOperation };
	'/v1/things/{id}:archive': { get: TTemplateOperation };
}

interface TTemplateOperation {
	parameters: { path: Record<string, string> };
	requestBody?: never;
	responses: {
		200: {
			headers: Record<string, unknown>;
			content: { 'application/json': Record<string, string> };
		};
	};
}
