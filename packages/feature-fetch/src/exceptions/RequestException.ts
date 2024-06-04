import { ServiceException, type TErrorCode } from './ServiceException';

export class RequestException<GData = any> extends ServiceException {
	public readonly status: number;
	public readonly response?: Response;
	public readonly data?: GData;

	constructor(code: TErrorCode, status: number, options: TRequestExceptionOptions<GData> = {}) {
		const { description, response, data } = options;
		super(code, {
			message: `Call to endpoint failed with status ${status}${
				description != null ? `: ${description}` : '!'
			}`
		});
		this.status = status;
		this.response = response;
		this.data = data;
	}
}

interface TRequestExceptionOptions<GData> {
	description?: string;
	data?: GData;
	response?: Response;
}
