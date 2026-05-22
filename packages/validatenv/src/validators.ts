import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { TEnvValidator } from './types';

/** Requires a string value. */
export const stringValidator = defineEnvValidator<string>((value) => {
	if (typeof value !== 'string') {
		return invalid('Must be a string');
	}

	return valid(value);
});

/** Accepts "true", "t", "yes", "on", "1" and their false counterparts. Returns a boolean. */
export const booleanValidator = defineEnvValidator<boolean>((value) => {
	if (typeof value === 'boolean') {
		return valid(value);
	}

	if (typeof value !== 'string') {
		return invalid('Must be a valid boolean value');
	}

	const normalizedValue = value.toLowerCase();
	if (validTrueValues.includes(normalizedValue)) {
		return valid(true);
	}

	if (validFalseValues.includes(normalizedValue)) {
		return valid(false);
	}

	return invalid('Must be a valid boolean value');
});

const validTrueValues = ['true', 't', 'yes', 'on', '1'];
const validFalseValues = ['false', 'f', 'no', 'off', '0'];

/** Parses finite numbers from strings or number values. */
export const numberValidator = defineEnvValidator<number>((value) => {
	const numberValue = parseNumberValue(value);
	if (numberValue == null) {
		return invalid('Must be a valid number');
	}

	return valid(numberValue);
});

/** Checks a practical email shape: local part, at sign, domain with at least one dot. */
export const emailValidator = defineEnvValidator<string>((value) => {
	if (typeof value !== 'string') {
		return invalid('Must be a string');
	}

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
		return invalid('Must be a valid email address');
	}

	return valid(value);
});

/** Accepts fully qualified domain names and IPv4 or IPv6 addresses. */
export const hostValidator = defineEnvValidator<string>((value) => {
	if (typeof value !== 'string' || (!isFqdn(value) && !isIpAddress(value))) {
		return invalid('Must be a valid domain name or IP address');
	}

	return valid(value);
});

/** Validates integer port numbers in the range 1 to 65535. */
export const portValidator = defineEnvValidator<number>((value) => {
	const portValue = parseNumberValue(value);
	if (portValue == null || !Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
		return invalid('Must be a valid port number (1-65535)');
	}

	return valid(portValue);
});

/** Requires a valid URL parseable by the WHATWG URL standard. */
export const urlValidator = defineEnvValidator<string>((value) => {
	if (typeof value !== 'string') {
		return invalid('Must be a string');
	}

	try {
		new URL(value);
	} catch {
		return invalid('Must be a valid URL');
	}

	return valid(value);
});

/** Parses a JSON string and returns the parsed value. Output type is unknown. */
export const jsonValidator = defineEnvValidator<unknown>((value) => {
	if (typeof value !== 'string') {
		return invalid('Must be a string');
	}

	try {
		return valid(JSON.parse(value));
	} catch {
		return invalid('Must be valid JSON');
	}
});

function defineEnvValidator<GValue>(
	validate: (value: unknown) => StandardSchemaV1.Result<GValue>
): TEnvValidator<unknown, GValue> {
	return {
		'~standard': {
			version: 1,
			vendor: 'validatenv',
			validate
		}
	};
}

function valid<GValue>(value: GValue): StandardSchemaV1.SuccessResult<GValue> {
	return { value };
}

function invalid(message: string): StandardSchemaV1.FailureResult {
	return {
		issues: [{ message }]
	};
}

function parseNumberValue(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}

	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}

	const numberValue = Number(value);
	if (!Number.isFinite(numberValue)) {
		return null;
	}

	return numberValue;
}

function isFqdn(value: string): boolean {
	const normalizedValue = value.endsWith('.') ? value.slice(0, -1) : value;
	const labels = normalizedValue.split('.');
	if (normalizedValue.length > 253 || labels.length < 2) {
		return false;
	}

	return labels.every(isFqdnLabel) && /[a-z]/i.test(labels[labels.length - 1] ?? '');
}

function isFqdnLabel(label: string): boolean {
	return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label);
}

function isIpAddress(value: string): boolean {
	return isIpv4Address(value) || isIpv6Address(value);
}

function isIpv4Address(value: string): boolean {
	const segments = value.split('.');
	if (segments.length !== 4) {
		return false;
	}

	return segments.every((segment) => {
		if (!/^\d+$/.test(segment)) {
			return false;
		}

		const numberValue = Number(segment);
		return numberValue >= 0 && numberValue <= 255;
	});
}

function isIpv6Address(value: string): boolean {
	try {
		new URL(`http://[${value}]/`);
		return true;
	} catch {
		return false;
	}
}
