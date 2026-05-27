import { FetchError } from '../errors';

/**
 * Replaces OpenAPI-style path placeholders with shallow param values, leaves missing values unresolved, and rejects unsupported values.
 *
 * @see https://swagger.io/docs/specification/v3_0/serialization/#path-parameters
 */
export function serializePathParams(
	pathTemplate: string,
	pathParams: Record<string, unknown> = {}
): string {
	return pathTemplate.replace(pathParamPlaceholderRegex, (pathParamPlaceholder) => {
		const pathParam = parsePathParamPlaceholder(pathParamPlaceholder);
		const value = pathParams[pathParam.name];
		if (value == null) {
			return pathParamPlaceholder;
		}

		if (Array.isArray(value)) {
			return serializeArrayParam(pathParam.name, value, pathParam);
		}

		if (isPlainParamRecord(value)) {
			return serializeObjectParam(pathParam.name, value, pathParam);
		}

		if (isParamPrimitive(value)) {
			if (pathParam.style === 'matrix') {
				return `;${serializeNamedParam(pathParam.name, value)}`;
			}
			if (pathParam.style === 'label') {
				return `.${serializeParamValue(value)}`;
			}
			return serializeParamValue(value);
		}

		throw new FetchError('#ERR_SERIALIZE_PARAMS', {
			message: `Path param "${pathParam.name}" is not serializable.`
		});
	});
}

const pathParamPlaceholderRegex = /\{[^{}]+\}/g;

function parsePathParamPlaceholder(placeholder: string): TParsedPathParam {
	let paramName = placeholder.substring(1, placeholder.length - 1);
	let explode = false;
	let style: TPathParamStyle = 'simple';

	if (paramName.endsWith('*')) {
		explode = true;
		paramName = paramName.substring(0, paramName.length - 1);
	}
	if (paramName.startsWith('.')) {
		style = 'label';
		paramName = paramName.substring(1);
	} else if (paramName.startsWith(';')) {
		style = 'matrix';
		paramName = paramName.substring(1);
	}

	return {
		explode,
		name: paramName,
		style
	};
}

interface TParsedPathParam {
	name: string;
	style: TPathParamStyle;
	explode: boolean;
}

type TPathParamStyle = 'simple' | 'label' | 'matrix';

/**
 * Serializes shallow query params with OpenAPI defaults, skips nullish values, and rejects unsupported values.
 *
 * @see https://swagger.io/docs/specification/v3_0/serialization/#query-parameters
 */
export function serializeQueryParams(
	queryParams: Record<string, unknown> = {},
	options: TSerializeQueryParamsOptions = {}
): string {
	const { object: objectOptions = {}, array: arrayOptions = {}, allowReserved = false } = options;
	const serializedParams: string[] = [];

	for (const [name, value] of Object.entries(queryParams)) {
		if (value == null) {
			continue;
		}

		let serializedParam: string;
		if (Array.isArray(value)) {
			serializedParam = serializeArrayParam(name, value, {
				style: arrayOptions.style ?? 'form',
				explode: arrayOptions.explode ?? true,
				allowReserved
			});
		} else if (isPlainParamRecord(value)) {
			serializedParam = serializeObjectParam(name, value, {
				style: objectOptions.style ?? 'deepObject',
				explode: objectOptions.explode ?? true,
				allowReserved
			});
		} else {
			serializedParam = serializeNamedParam(name, value, allowReserved);
		}

		if (serializedParam.length > 0) {
			serializedParams.push(serializedParam);
		}
	}

	return serializedParams.join('&');
}

export interface TSerializeQueryParamsOptions {
	/** Array serialization options. Defaults to form style with explode enabled. */
	array?: TSerializeQueryArrayOptions;
	/** Object serialization options. Defaults to deepObject style with explode enabled. */
	object?: TSerializeQueryObjectOptions;
	/** Preserves reserved URL characters when true. */
	allowReserved?: boolean;
}

interface TSerializeQueryArrayOptions {
	style?: 'form' | 'spaceDelimited' | 'pipeDelimited';
	explode?: boolean;
}

interface TSerializeQueryObjectOptions {
	style?: 'form' | 'deepObject';
	explode?: boolean;
}

function serializeArrayParam(
	name: string,
	value: unknown[],
	config: TSerializeArrayParamConfig
): string {
	const { style, explode, allowReserved = false } = config;
	const items = value.filter((item) => item != null);
	if (!items.length) {
		return '';
	}

	if (!explode) {
		const delimiter = getUnexplodedArrayDelimiter(style);
		const serializedValue = items
			.map((item) => serializeParamValue(item, allowReserved))
			.join(delimiter);

		switch (style) {
			case 'simple':
				return serializedValue;
			case 'label':
				return `.${serializedValue}`;
			case 'matrix':
				return `;${name}=${serializedValue}`;
			default:
				return `${name}=${serializedValue}`;
		}
	}

	const delimiter = getExplodedDelimiter(style);
	const serializedValue = items
		.map((item) => {
			if (style === 'simple' || style === 'label') {
				return serializeParamValue(item, allowReserved);
			}

			return serializeNamedParam(name, item, allowReserved);
		})
		.join(delimiter);

	if (style === 'label' || style === 'matrix') {
		return `${delimiter}${serializedValue}`;
	}

	return serializedValue;
}

interface TSerializeArrayParamConfig {
	style: TArrayParamStyle;
	explode: boolean;
	allowReserved?: boolean;
}

type TArrayParamStyle = 'simple' | 'label' | 'matrix' | 'form' | 'spaceDelimited' | 'pipeDelimited';

function getUnexplodedArrayDelimiter(style: TArrayParamStyle): string {
	switch (style) {
		case 'spaceDelimited':
			return '%20';
		case 'pipeDelimited':
			return '|';
		default:
			return ',';
	}
}

function serializeObjectParam(
	name: string,
	value: Record<string, unknown>,
	config: TSerializeObjectParamConfig
): string {
	const { style, explode, allowReserved = false } = config;
	const entries = Object.entries(value).filter(([, propertyValue]) => propertyValue != null);
	if (!entries.length) {
		return '';
	}

	if (!explode && style !== 'deepObject') {
		const serializedValue = entries
			.flatMap(([propertyName, propertyValue]) => [
				propertyName,
				serializeParamValue(propertyValue, allowReserved)
			])
			.join(',');

		switch (style) {
			case 'form':
				return `${name}=${serializedValue}`;
			case 'label':
				return `.${serializedValue}`;
			case 'matrix':
				return `;${name}=${serializedValue}`;
			default:
				return serializedValue;
		}
	}

	const delimiter = getExplodedDelimiter(style);
	const serializedValue = entries
		.map(([propertyName, propertyValue]) => {
			const serializedName = style === 'deepObject' ? `${name}[${propertyName}]` : propertyName;
			return serializeNamedParam(serializedName, propertyValue, allowReserved);
		})
		.join(delimiter);

	if (style === 'label' || style === 'matrix') {
		return `${delimiter}${serializedValue}`;
	}

	return serializedValue;
}

interface TSerializeObjectParamConfig {
	style: TObjectParamStyle;
	explode: boolean;
	allowReserved?: boolean;
}

type TObjectParamStyle = 'simple' | 'label' | 'matrix' | 'form' | 'deepObject';

function getExplodedDelimiter(style: TArrayParamStyle | TObjectParamStyle): string {
	switch (style) {
		case 'simple':
			return ',';
		case 'label':
			return '.';
		case 'matrix':
			return ';';
		default:
			return '&';
	}
}

function serializeNamedParam(name: string, value: unknown, allowReserved = false): string {
	return `${name}=${serializeParamValue(value, allowReserved)}`;
}

function serializeParamValue(value: unknown, allowReserved = false): string {
	if (!isParamPrimitive(value)) {
		throw new FetchError('#ERR_SERIALIZE_PARAMS', {
			message:
				'Only string, number, boolean, arrays of primitives, and plain objects with primitive values are supported by the default param serializers.'
		});
	}

	const serializedValue = String(value);
	return allowReserved ? serializedValue : encodeURIComponent(serializedValue);
}

function isParamPrimitive(value: unknown): value is TParamPrimitive {
	return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

type TParamPrimitive = string | number | boolean;

function isPlainParamRecord(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value == null || Array.isArray(value)) {
		return false;
	}

	// Note: Avoids serializing Date and class instances as empty OpenAPI objects
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype == null;
}
