import { type TValidationError } from 'validation-adapter';

import { ServiceError } from './ServiceError';

export class ValidationError extends ServiceError {
	constructor(errors: TValidationError[]) {
		super('#ERR_BAD_REQUEST', 400, {
			description: 'One or more validation errors occurred!',
			additionalErrors: errors
		});
	}
}
