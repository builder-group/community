import { serializeBodyToJson } from './serialize-body-to-json';

export function serializeBody<GBody = any>(body: GBody, contentType?: string): RequestInit['body'] {
	if (contentType != null && contentType.startsWith('application/json')) {
		return serializeBodyToJson(body);
	}
	return body as any; // TODO:
}
