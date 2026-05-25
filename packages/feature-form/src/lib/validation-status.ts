import { type TValidationError, type TValidationPath, type TValidationStatusValue } from '../types';

/** Compares validation statuses so reactive status state can skip equivalent updates. */
export function areValidationStatusesEqual(
	current: TValidationStatusValue,
	next: TValidationStatusValue
): boolean {
	if (current.type !== next.type) {
		return false;
	}

	if (current.type !== 'invalid' || next.type !== 'invalid') {
		return true;
	}

	return areValidationErrorsEqual(current.errors, next.errors);
}

function areValidationErrorsEqual(
	current: readonly TValidationError[],
	next: readonly TValidationError[]
): boolean {
	if (current.length !== next.length) {
		return false;
	}

	return current.every(
		(error, index) =>
			error.message === next[index]?.message &&
			areValidationPathsEqual(error.path, next[index]?.path)
	);
}

function areValidationPathsEqual(
	current: TValidationPath | undefined,
	next: TValidationPath | undefined
): boolean {
	if (current == null || next == null) {
		return current == null && next == null;
	}

	if (current.length !== next.length) {
		return false;
	}

	return current.every((segment, index) => Object.is(segment, next[index]));
}
