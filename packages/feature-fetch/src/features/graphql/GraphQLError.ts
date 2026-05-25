import { FetchError, type TFetchErrorCode } from '../../errors';
import type { TGraphQLError } from './graphql';

/** Represents a GraphQL response whose `errors` array is not empty. */
export class GraphQLError<GData = unknown> extends FetchError {
	public readonly errors: TGraphQLError[];
	public readonly response: Response;
	public readonly data?: GData | null;
	public readonly extensions?: Record<string, unknown>;

	constructor(errors: TGraphQLError[], options: TGraphQLErrorOptions<GData>) {
		const { code = '#ERR_GRAPHQL_OPERATION', response, data, extensions } = options;
		super(code, {
			message: formatGraphQLErrorMessage(errors)
		});
		this.errors = errors;
		this.response = response;
		this.data = data;
		this.extensions = extensions;
	}
}

export interface TGraphQLErrorOptions<GData = unknown> {
	code?: TFetchErrorCode;
	response: Response;
	data?: GData | null;
	extensions?: Record<string, unknown>;
}

function formatGraphQLErrorMessage(errors: TGraphQLError[]): string {
	if (!errors.length) {
		return 'GraphQL operation failed';
	}

	const errorMessages = errors.map((error) => error.message).join(', ');
	if (errors.length === 1) {
		return `GraphQL operation failed: ${errorMessages}`;
	}

	return `GraphQL operation failed with ${errors.length} errors: ${errorMessages}`;
}
