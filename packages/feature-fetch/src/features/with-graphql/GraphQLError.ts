import { FetchError, type TErrorCode } from '../../exceptions/FetchError';
import type { TGraphQLError } from '../../types';

export class GraphQLError<GData = unknown> extends FetchError {
	public readonly errors: TGraphQLError[];
	public readonly response?: Response;
	public readonly data?: GData;
	public readonly extensions?: Record<string, any>;

	constructor(code: TErrorCode, options: TGraphQLErrorOptions<GData>) {
		const { errors, response, data, extensions } = options;
		super(code, {
			description: `GraphQL query failed with ${errors.length} error(s): ${errors
				.map((error) => error.message)
				.join(', ')}`
		});
		this.errors = errors;
		this.response = response;
		this.data = data;
		this.extensions = extensions;
	}
}

interface TGraphQLErrorOptions<GData> {
	errors: TGraphQLError[];
	data?: GData;
	extensions?: Record<string, any>;
	response?: Response;
}
