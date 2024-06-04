import { AppError } from './AppError';

export class ValidationError extends AppError {
	public readonly errors: TValidationErrorDetails[];

	constructor(errors: TValidationErrorDetails[]) {
		super(400, '#ERR_BAD_REQUEST', {
			description: 'One or more validation errors occurred!',
			additionalErrors: errors.map((err) => ({ property: err.property, message: err.message }))
		});
		this.errors = errors;
	}
}

export interface TValidationErrorDetails {
	property: string;
	message: string;
	error: Error;
}
