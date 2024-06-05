import { type TSerializedBody } from '../../../types';
import { serializeBodyToJson } from './serialize-body-to-json';

export function serializeBody<GBody>(body: GBody, contentType?: string): TSerializedBody {
	if (contentType?.startsWith('application/json')) {
		return serializeBodyToJson(body);
	}
	return body as RequestInit['body'];
}
