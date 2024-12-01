import { createValidator } from 'validation-adapter';
import { validateEnv } from './validate-env';

export * from './defaults';
export * from './middlewares';
export * from './types';
export { validateEnv } from './validate-env';

// Example: TODO REMOVE Later
const result = validateEnv(process.env, {
	environment: {
		validator: createValidator<string | null>([{ key: 'required', validate: () => {} }])
	},
	test2: {
		validator: createValidator<number>([{ key: 'required', validate: () => {} }])
	}
});
