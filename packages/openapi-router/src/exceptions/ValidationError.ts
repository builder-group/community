import { type TValidationError } from 'validation-adapter';

import { AppError } from './AppError';

export class ValidationError extends AppError {
	constructor(errors: TValidationError[]) {
		super('#ERR_BAD_REQUEST', 400, {
			description: 'One or more validation errors occurred!',
			additionalErrors: errors
		});
	}
}
