import { FetchError, type TFetchErrorCode } from '../../errors';
import type { TGraphQLError } from './graphql';

/** Represents a GraphQL response whose `errors` array is not empty. */
export class GraphQLError<GData = unknown> extends FetchError {
	/** GraphQL errors returned by the server. */
	public readonly errors: TGraphQLError[];
	public readonly response: Response;
	/** Partial GraphQL data returned with the errors, when provided. */
	public readonly data?: GData | null;
	/** GraphQL response extensions returned with the errors, when provided. */
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
	/** Stable feature-fetch error code. Defaults to `#ERR_GRAPHQL_OPERATION`. */
	code?: TFetchErrorCode;
	response: Response;
	/** Partial GraphQL data returned with the errors, when provided. */
	data?: GData | null;
	/** GraphQL response extensions returned with the errors, when provided. */
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
