import type { TOpenApiValidationIssue } from '../types';
import { OpenApiRouterError } from './OpenApiRouterError';

/** Raised when body, path, or query schemas reject a request. */
export class OpenApiValidationError extends OpenApiRouterError {
	declare public readonly status: 400;
	/** Collected validation issues with source metadata. */
	public readonly issues: readonly TOpenApiValidationIssue[];

	constructor(issues: readonly TOpenApiValidationIssue[]) {
		super('#ERR_OPENAPI_VALIDATION', {
			message: formatOpenApiValidationErrorMessage(issues),
			status: 400
		});
		this.issues = issues;
	}
}

function formatOpenApiValidationErrorMessage(issues: readonly TOpenApiValidationIssue[]): string {
	if (issues.length === 1) {
		return issues[0]?.message ?? 'Request validation failed';
	}

	return `${issues.length} request validation errors occurred`;
}
