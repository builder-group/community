import { serializeArrayParam } from './serialize-array-param';
import { serializeObjectParam } from './serialize-object-param';
import { serializePrimitiveParam } from './serialize-primitive-param';

// https://swagger.io/docs/specification/serialization/#query
export interface TSerializeQueryParamsOptions {
	array?: {
		style?: 'form' | 'spaceDelimited' | 'pipeDelimited';
		/**
		 * Specifies whether arrays and objects should generate separate parameters
		 * for each array item or object property.
		 *
		 * @see https://swagger.io/docs/specification/serialization/#query
		 */
		explode?: boolean;
	};
	object?: {
		style?: 'form' | 'deepObject';
		/**
		 * Specifies whether arrays and objects should generate separate parameters
		 * for each array item or object property.
		 *
		 * @see https://swagger.io/docs/specification/serialization/#query
		 */
		explode?: boolean;
	};
	/**
	 * Specifies whether the reserved characters
	 * `:/?#[]@!$&'()*+,;=` in parameter values are allowed to be sent as they
	 * are, or should be percent-encoded. By default, allowReserved is `false`,
	 * and reserved characters are percent-encoded.
	 *
	 * @see https://swagger.io/docs/specification/serialization/#query
	 */
	allowReserved?: boolean;
}

export function serializeQueryParams(
	queryParams: Record<string, unknown>,
	options: TSerializeQueryParamsOptions = {}
): string {
	const { object: objectOptions = {}, array: arrayOptions = {}, allowReserved } = options;
	const search: string[] = [];

	for (const name in queryParams) {
		const value = queryParams[name];
		if (value == null) {
			continue;
		}

		if (Array.isArray(value)) {
			const { style = 'form', explode = true } = arrayOptions;
			search.push(
				serializeArrayParam(name, value, {
					style,
					explode,
					allowReserved
				})
			);
		} else if (typeof value === 'object') {
			const { style = 'deepObject', explode = true } = objectOptions;
			search.push(
				serializeObjectParam(name, value as Record<string, unknown>, {
					style,
					explode,
					allowReserved
				})
			);
		} else {
			search.push(serializePrimitiveParam(name, value, options.allowReserved));
		}
	}
	return search.join('&');
}
