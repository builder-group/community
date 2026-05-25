import { Err, Ok, type TResult } from 'tuple-result';
import { mapErrorToFetchError, type FetchError } from '../../errors';
import type { TGraphQLDocumentInput } from './graphql';

/** Returns an operation string from a GraphQL string or document input. */
export async function getOperationString<
	GResult extends object = object,
	GVariables extends object = Record<string, unknown>
>(document: TGraphQLDocumentInput<GResult, GVariables>): Promise<TResult<string, FetchError>> {
	if (typeof document === 'string') {
		return Ok(document);
	}

	if (document.loc?.source.body != null) {
		return Ok(document.loc.source.body);
	}

	try {
		// Note: Load the printer only for documents that do not carry their original source
		const { print } = await import('@0no-co/graphql.web');
		return Ok(print(document));
	} catch (error) {
		return Err(
			mapErrorToFetchError(error, '#ERR_GRAPHQL_PRINT', 'Failed to print GraphQL document')
		);
	}
}
