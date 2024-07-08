import { ServiceError, type TErrorCode } from './ServiceError';

export class RequestError<GData = unknown> extends ServiceError {
	public readonly status: number;
	public readonly response?: Response;
	public readonly data?: GData;

	constructor(code: TErrorCode, status: number, options: TRequestErrorOptions<GData> = {}) {
		const { description, response, data } = options;
		super(code, {
			description: `Call to endpoint failed by exception with status code ${status.toString()}${
				description != null ? `: ${description}` : '!'
			}`
		});
		this.status = status;
		this.response = response;
		this.data = data;
	}
}

interface TRequestErrorOptions<GData> {
	description?: string;
	data?: GData;
	response?: Response;
}
