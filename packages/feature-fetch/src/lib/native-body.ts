/** Returns whether a value can be passed to fetch as a native request body. */
export function isNativeBody(body: unknown): body is NonNullable<RequestInit['body']> {
	return (
		typeof body === 'string' ||
		isFormData(body) ||
		isBlob(body) ||
		isArrayBuffer(body) ||
		isArrayBufferView(body) ||
		isReadableStream(body) ||
		isUrlSearchParams(body)
	);
}

export function isFormData(body: unknown): body is FormData {
	return typeof FormData !== 'undefined' && body instanceof FormData;
}

export function isUrlSearchParams(body: unknown): body is URLSearchParams {
	return typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
}

function isBlob(body: unknown): body is Blob {
	return typeof Blob !== 'undefined' && body instanceof Blob;
}

function isArrayBuffer(body: unknown): body is ArrayBuffer {
	return typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer;
}

function isArrayBufferView(body: unknown): body is ArrayBufferView {
	return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body);
}

function isReadableStream(body: unknown): body is ReadableStream {
	return typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
}
