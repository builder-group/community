import { createValidationAdapter } from 'validation-adapter';
import { describe, expect, it } from 'vitest';

import { createForm, fromValidationAdapter } from './create-form';

describe('createForm function', () => {
	it('shoudl work', async () => {
		const form = createForm({
			fields: {
				item5: fromValidationAdapter<number>(
					createValidationAdapter([
						{
							key: 'date',
							validate: (cx) => {
								if (cx.value != null) {
									const date = new Date(cx.value);
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
