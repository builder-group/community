import { maybeEncode } from './maybe-encode';
import { serializePrimitiveParam } from './serialize-primitive-param';

export function serializeObjectParam(
	name: string,
	value: unknown,
	options: TSerializeObjectParamsOptions
): string {
	if (typeof value !== 'object' || value == null) {
		return '';
	}

	const { style = 'deepObject', explode = true, allowReserved = false } = options;
	let joiner;
	switch (style) {
		case 'simple':
			joiner = ',';
			break;
		case 'label':
			joiner = '.';
			break;
		case 'matrix':
			joiner = ';';
			break;
		default:
			joiner = '&';
	}

	// Explode
	if (!explode && style !== 'deepObject') {
		const final = Object.entries(value)
			.reduce<string[]>((acc, [k, v]) => {
				acc.push(k, maybeEncode(v, allowReserved));
				return acc;
			}, [])
			.join(',');

		switch (style) {
			case 'form':
				return `${name}=${final}`;
			case 'label':
				return `.${final}`;
			case 'matrix':
				return `;${name}=${final}`;
			default:
				return final;
		}
	}

	const final = Object.entries(value)
		.reduce<string[]>((acc, [k, v]) => {
			const finalName = style === 'deepObject' ? `${name}[${k}]` : k;
			acc.push(serializePrimitiveParam(finalName, v, allowReserved));
			return acc;
		}, [])
		.join(joiner);

	switch (style) {
		case 'label':
		case 'matrix':
			return `${joiner}${final}`;
		default:
			return final;
	}
}

export interface TSerializeObjectParamsOptions {
	/**
	 * Defines how multiple values are delimited.
	 * Possible styles depend on the parameter location – path, query, header or cookie.
	 *
	 * @see https://swagger.io/docs/specification/serialization/#query
	 */
	style?: 'simple' | 'label' | 'matrix' | 'form' | 'deepObject';
	/**
	 * Specifies whether arrays and objects should generate separate parameters
	 * for each array item or object property.
	 *
	 * @see https://swagger.io/docs/specification/serialization/#query
	 */
	explode?: boolean;
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
