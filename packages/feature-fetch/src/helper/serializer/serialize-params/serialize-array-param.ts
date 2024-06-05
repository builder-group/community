import { maybeEncode } from './maybe-encode';
import { serializePrimitiveParam } from './serialize-primitive-param';

export function serializeArrayParam(
	name: string,
	value: unknown,
	options: TSerializeArrayParamsOptions
): string {
	if (!Array.isArray(value)) {
		return '';
	}

	const { style = 'deepObject', explode = true, allowReserved = false } = options;

	if (!explode) {
		let joiner;
		switch (style) {
			case 'form':
				joiner = ',';
				break;
			case 'spaceDelimited':
				joiner = '%20';
				break;
			case 'pipeDelimited':
				joiner = '|';
				break;
			default:
				joiner = ',';
		}
		const final = value.map((v) => maybeEncode(v, allowReserved)).join(joiner);

		switch (options.style) {
			case 'simple':
				return final;
			case 'label':
				return `.${final}`;
			case 'matrix':
				return `;${name}=${final}`;
			default:
				return `${name}=${final}`;
		}
	}

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
	const final = value
		.map((v) => {
			switch (style) {
				case 'simple':
				case 'label':
					return maybeEncode(v, allowReserved);
				default:
					return serializePrimitiveParam(name, v, allowReserved);
			}
		})
		.join(joiner);

	switch (style) {
		case 'label':
		case 'matrix':
			return `${joiner}${final}`;
		default:
			return final;
	}
}

export interface TSerializeArrayParamsOptions {
	/**
	 * Defines how multiple values are delimited.
	 * Possible styles depend on the parameter location – path, query, header or cookie.
	 *
	 * @see https://swagger.io/docs/specification/serialization/#query
	 */
	style?: 'simple' | 'label' | 'matrix' | 'form' | 'spaceDelimited' | 'pipeDelimited';
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
