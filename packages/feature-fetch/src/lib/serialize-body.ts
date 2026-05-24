import { type TSerializedBody } from '../types';
import { isFormData, isNativeBody, isUrlSearchParams } from './native-body';

/** Serializes request bodies for JSON and form URL encoded content types. */
export function serializeBody<GBody>(body: GBody, contentType?: string): TSerializedBody {
	// Note: FormData must stay intact so fetch can add the multipart boundary later
	if (isFormData(body)) {
		return body;
	}

	const mediaType = contentType?.split(';')[0]?.trim().toLowerCase() ?? '';

	if (mediaType === 'application/x-www-form-urlencoded') {
		return serializeFormUrlEncodedBody(body);
	}

	const isJsonMediaType = mediaType === 'application/json' || mediaType.endsWith('+json');
	// Note: Native BodyInit values are already serialized and should not be JSON-stringified
	const shouldSerializeJson = isJsonMediaType && !isNativeBody(body);
	if (shouldSerializeJson) {
		return JSON.stringify(body);
	}

	return body as TSerializedBody;
}

function serializeFormUrlEncodedBody(body: unknown): TSerializedBody {
	// Note: In runtimes without URLSearchParams, leave the body untouched instead of guessing
	if (typeof URLSearchParams === 'undefined') {
		return body as TSerializedBody;
	}
	if (typeof body === 'string' || isUrlSearchParams(body)) {
		return new URLSearchParams(body).toString();
	}
	if (isNativeBody(body)) {
		return body;
	}
	const isFormRecord = typeof body === 'object' && body != null && !Array.isArray(body);
	if (isFormRecord) {
		const entries = Object.entries(body)
			.filter(([, value]) => value != null)
			.map(([name, value]) => [name, String(value)]);
		return new URLSearchParams(entries).toString();
	}

	return body as TSerializedBody;
}
