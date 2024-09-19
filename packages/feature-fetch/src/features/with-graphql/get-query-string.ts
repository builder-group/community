import { Ok, type TResult } from '@blgc/utils';

import { type FetchError } from '../../exceptions';
import { type TDocumentInput } from '../../types';

export async function getQueryString<
	GResult extends Record<string, any>,
	GVariables extends Record<string, any>
>(document: TDocumentInput<GResult, GVariables>): Promise<TResult<string, FetchError>> {
	if (typeof document === 'string') {
		return Ok(document);
	}

	if (document.loc?.source.body != null) {
		return Ok(document.loc.source.body);
	}

	const { print } = await import('@0no-co/graphql.web');
	return Ok(print(document));
}
