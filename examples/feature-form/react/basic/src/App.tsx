import {
	bitwiseFlag,
	createForm,
	createValidator,
	FormFieldReValidateMode,
	FormFieldValidateMode,
	TFormFieldValidator,
	valibotValidator,
	zodValidator
} from 'feature-form';
import { useForm } from 'feature-react/form';
import { withGlobalBind } from 'feature-react/state';
import React from 'react';
import * as v from 'valibot';
import * as z from 'zod';

import './App.css';

import { StatusMessage } from './components';

type TGender = 'Male' | 'Female';

type TFormData = {
	// [key: string]: string; // https://stackoverflow.com/questions/65799316/why-cant-an-interface-be-assigned-to-recordstring-unknown
	firstName: string;
	lastName: string;
	gender: TGender;
	// userName: string;
	email: string;
	// aboutYou: string;
	// image: {
	// 	id: string;
	// 	color: string;
	// };
};

const valibotNameValidator = valibotValidator(
	v.pipe(v.string(), v.minLength(2), v.maxLength(10), v.regex(/^([^0-9]*)$/))
);

const zodNameValidator = zodValidator(
	z
		.string()
		.min(2)
		.max(10)
		.regex(/^([^0-9]*)$/)
);

const zodEmailValidator = zodValidator(z.string().email().max(30).min(1));

let renderCount = 0;

const $form = withGlobalBind(
	'_form',
	createForm<TFormData>({
		fields: {
			firstName: {
				validator: zodNameValidator,
				defaultValue: ''
			},
			lastName: {
				validator: valibotNameValidator.clone().append(
					createValidator([
						{
							key: 'jeff',
							validate: (formField) => {
								if (formField.get()?.includes('Jeff')) {
									formField.status.registerNextError({
										code: 'jeff-not-last-name',
										message: 'Jeff is not a last name!'
									});
								}
							}
						}
					])
				),
				defaultValue: ''
			},
			gender: {
				validator: valibotValidator(v.string()) as TFormFieldValidator<'Male' | 'Female'>,
				defaultValue: 'Female'
			},
			email: {
				validator: zodEmailValidator,
				defaultValue: ''
			}
		},
		onValidSubmit: (data, additionalData) => {
			console.log('ValidSubmit', { data, additionalData });
		},
		onInvalidSubmit: (errors, additionalData) => {
			console.log('Invalid Submit', { errors, additionalData });
		},
		notifyOnStatusChange: false,
		validateMode: bitwiseFlag(FormFieldValidateMode.OnSubmit, FormFieldValidateMode.OnChange),
		reValidateMode: bitwiseFlag(FormFieldReValidateMode.OnBlur, FormFieldReValidateMode.OnChange)
	})
);

function App() {
	const { handleSubmit, status, field, register } = useForm($form);
	const [data, setData] = React.useState('');

	renderCount++;

	return (
		<form
			onSubmit={handleSubmit({
				onValidSubmit: (data) => setData(JSON.stringify(data)),
				preventDefault: true
			})}
		>
			<h1>Sign Up</h1>

			<label>First Name:</label>
			<input {...register('firstName')} />
			<StatusMessage $status={status('firstName')} />

			<label>Last Name:</label>
			<input {...register('lastName')} />
			<StatusMessage $status={status('lastName')} />

			<label>Gender</label>
			<select
				defaultValue={''}
				onChange={(e) =>
					field('gender').set(e.target.value as TGender, {
						additionalData: { background: true }
					})
				}
			>
				<option value={''}>Select...</option>
				<option value="male">Male</option>
				<option value="female">Female</option>
			</select>
			<StatusMessage $status={status('gender')} />

			<label>Email:</label>
			<input {...register('email')} />
			<StatusMessage $status={status('email')} />

			<button type="submit">Submit</button>
			<p>Is Valid: {$form.isValid.toString()}</p>
			<p>Render Count: {renderCount}</p>
			<p>Data {data}</p>
		</form>
	);
}

export default App;
