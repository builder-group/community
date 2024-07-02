import { describe, expect, it } from 'vitest';

import { createForm, fromValidator } from './create-form';
import { createValidator } from './form-field';

describe('createForm function', () => {
	it('shoudl work', async () => {
		const form = createForm({
			fields: {
				item5: fromValidator<number>(
					createValidator([
						{
							key: 'date',
							validate: (formField) => {
								if (formField._value != null) {
									const date = new Date(formField._value);
								}
							}
						}
					]),
					{
						defaultValue: Date.now()
					}
				)
			}
		});

		const test = form.getField('item5');

		const isValid = await form.validate();
		await form.submit();

		expect(form).not.toBeNull();
	});
});
