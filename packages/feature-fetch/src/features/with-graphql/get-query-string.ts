import { Err, Ok, type TResult } from '@blgc/utils';

import { FetchError } from '../../exceptions';
import { type TDocumentInput } from '../../types';

export function getQueryString<
	GResult extends Record<string, any>,
	GVariables extends Record<string, any>
>(document: TDocumentInput<GResult, GVariables>): TResult<string, FetchError> {
	if (typeof document === 'string') {
		return Ok(document);
	}

	if (document.loc?.source.body != null) {
		return Ok(document.loc.source.body);
	}

	return Err(new FetchError('#ERR_UNSUPPORTED_QUERY_FORMAT'));
}
