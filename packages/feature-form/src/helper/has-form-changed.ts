import { type TForm } from '../types';

export function hasFormChanged(form: TForm<any, any>): boolean {
	for (const key in form.fields) {
		if (form.fields[key]?.get() !== form.fields[key]?._intialValue) {
			return true;
		}
	}
	return false;
}
