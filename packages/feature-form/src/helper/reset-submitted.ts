import { type TForm } from '../types';

export function resetSubmitted(form: TForm<any, ['base']>): void {
	form.isSubmitted.set(false);
	form.isSubmitting.set(false);
	for (const formField of Object.values(form.fields)) {
		formField.isSubmitted = false;
		formField.isSubmitting = false;
	}
}
