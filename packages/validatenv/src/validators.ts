import { isFQDN, isIP } from '@blgc/utils';
import { createValidator } from 'validation-adapter';

export const stringValidator = createValidator<string>([
	{
		key: 'string',
		validate: (ctx) => {
			if (typeof ctx.value !== 'string') {
				ctx.registerError({
					code: 'invalid_type',
					message: 'Must be a string'
				});
			}
		}
	}
]);

const VALID_TRUE_VALUES = ['true', 't', 'yes', 'on', '1'];
const VALID_FALSE_VALUES = ['false', 'f', 'no', 'off', '0'];
export const booleanValidator = createValidator<boolean>([
	{
		key: 'boolean',
		validate: (ctx) => {
			if (typeof ctx.value !== 'string') {
				ctx.registerError({
					code: 'invalid_boolean',
					message: 'Must be a valid boolean value'
				});
				return;
			}

			const value = ctx.value.toLowerCase();
			if (!VALID_TRUE_VALUES.includes(value) && !VALID_FALSE_VALUES.includes(value)) {
				ctx.registerError({
					code: 'invalid_boolean',
					message: 'Must be a valid boolean value'
				});
				return;
			}

			ctx.value = VALID_TRUE_VALUES.includes(value);
		}
	}
]);

export const numberValidator = createValidator<number>([
	{
		key: 'number',
		validate: (ctx) => {
			const num = Number(ctx.value);
			if (Number.isNaN(num)) {
				ctx.registerError({
					code: 'invalid_number',
					message: 'Must be a valid number'
				});
				return;
			}
			ctx.value = num;
		}
	}
]);

// Intentionally non-exhaustive email validation
export const emailValidator = createValidator<string>([
	{
		key: 'email',
		validate: (ctx) => {
			if (typeof ctx.value !== 'string') {
				ctx.registerError({
					code: 'invalid_email',
					message: 'Must be a string'
				});
				return;
			}

			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(ctx.value)) {
				ctx.registerError({
					code: 'invalid_email',
					message: 'Must be a valid email address'
				});
			}
		}
	}
]);

export const hostValidator = createValidator<string>([
	{
		key: 'host',
		validate: (ctx) => {
			if (!isFQDN(ctx.value) && !isIP(ctx.value)) {
				ctx.registerError({
					code: 'invalid_host',
					message: 'Must be a valid domain name or IP address'
				});
			}
		}
	}
]);

export const portValidator = createValidator<number>([
	{
		key: 'port',
		validate: (ctx) => {
			const portNum = Number(ctx.value);
			if (Number.isNaN(portNum) || !Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
				ctx.registerError({
					code: 'invalid_port',
					message: 'Must be a valid port number (1-65535)'
				});
				return;
			}
			ctx.value = portNum;
		}
	}
]);

export const urlValidator = createValidator<string>([
	{
		key: 'url',
		validate: (ctx) => {
			if (typeof ctx.value !== 'string') {
				ctx.registerError({
					code: 'invalid_url',
					message: 'Must be a string'
				});
				return;
			}

			try {
				new URL(ctx.value);
			} catch {
				ctx.registerError({
					code: 'invalid_url',
					message: 'Must be a valid URL'
				});
			}
		}
	}
]);

export const jsonValidator = createValidator<unknown>([
	{
		key: 'json',
		validate: (ctx) => {
			if (typeof ctx.value !== 'string') {
				ctx.registerError({
					code: 'invalid_json',
					message: 'Must be a string'
				});
				return;
			}

			try {
				ctx.value = JSON.parse(ctx.value);
			} catch {
				ctx.registerError({
					code: 'invalid_json',
					message: 'Must be valid JSON'
				});
			}
		}
	}
]);
