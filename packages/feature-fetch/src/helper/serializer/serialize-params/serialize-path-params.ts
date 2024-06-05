import { serializeArrayParam } from './serialize-array-param';
import { serializeObjectParam } from './serialize-object-param';
import { serializePrimitiveParam } from './serialize-primitive-param';

const PATH_PARAM_REGEX = /\{[^{}]+\}/g;

export function serializePathParams(path: string, pathParams: Record<string, unknown>): string {
	return path.replace(PATH_PARAM_REGEX, (match) => {
		let name = match.substring(1, match.length - 1);
		let explode = false;
		let style: TPathParamStyle = 'simple';

		if (name.endsWith('*')) {
			explode = true;
			name = name.substring(0, name.length - 1);
		}
		if (name.startsWith('.')) {
			style = 'label';
			name = name.substring(1);
		} else if (name.startsWith(';')) {
			style = 'matrix';
			name = name.substring(1);
		}

		const value = pathParams[name];
		if (Array.isArray(value)) {
			return serializeArrayParam(name, value, { style, explode });
		} else if (typeof value === 'object') {
			return serializeObjectParam(name, value, { style, explode });
		} else if (style === 'matrix') {
			return `;${serializePrimitiveParam(name, value)}`;
		} else if (style === 'label') {
			return `.${value as string}`;
		}
		return value as string;
	});
}

type TPathParamStyle = 'simple' | 'label' | 'matrix';
