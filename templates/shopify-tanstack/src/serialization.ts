import { createSerializationAdapter } from '@tanstack/react-router';
import type { apiV1 } from '@template/api-shopify-hono/openapi';
import { HttpError, isHttpError } from 'feature-fetch';

// Note: Preserve HttpError's prototype and Problem Details payload across SSR so route error
// components can classify failures and display support references
export const httpErrorSerializationAdapter = createSerializationAdapter<
	HttpError<TApiErrorResponse>,
	TSerializedHttpError
>({
	key: 'feature-fetch/HttpError',
	test: (value): value is HttpError<TApiErrorResponse> => isHttpError(value),
	toSerializable: (error) => ({
		code: error.code,
		message: error.message,
		status: error.status,
		statusText: error.statusText,
		data: error.data
	}),
	fromSerializable: (serializedError) => {
		const error = new HttpError<TApiErrorResponse>(
			new Response(null, {
				status: serializedError.status,
				statusText: serializedError.statusText
			}),
			{
				code: serializedError.code,
				data: serializedError.data
			}
		);
		error.message = serializedError.message;
		return error;
	}
});

export type TApiErrorResponse = apiV1.components['schemas']['ErrorResponse'];

export interface TSerializedHttpError {
	code: HttpError['code'];
	message: string;
	status: number;
	statusText: string;
	data?: TApiErrorResponse;
}
