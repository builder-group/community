import {
	bitwiseFlag,
	createForm,
	createValidationAdapter,
	FormFieldReValidateMode,
	FormFieldValidateMode,
	TFormFieldValidationAdapter
} from 'feature-form';
import { useForm } from 'feature-react/form';
import { withGlobalBind } from 'feature-react/state';
import React from 'react';
import * as v from 'valibot';
import * as z from 'zod';
import { randomHex, shortId } from '@ibg/utils';

import './App.css';

import { valibotAdapter } from 'validation-adapters/valibot';
import { zodAdapter } from 'validation-adapters/zod';

import { StatusMessage } from './components';
import { isLightColor } from './utils';

type TGender = 'male' | 'female' | 'diverse';

type TFormData = {
	// [key: string]: string; // https://stackoverflow.com/questions/65799316/why-cant-an-interface-be-assigned-to-recordstring-unknown
	firstName: string;
	lastName: string;
	gender: TGender;
	email: string;
	image: {
		id: string;
		color: string;
	};
};

const valibotNameValidator = valibotAdapter(
	v.pipe(v.string(), v.minLength(2), v.maxLength(10), v.regex(/^([^0-9]*)$/))
);

const $form = withGlobalBind(
	'_form',
	createForm<TFormData>({
		fields: {
			firstName: {
				validationAdapter: valibotNameValidator.clone().append(
					createValidationAdapter([
						{
							key: 'jeff',
							validate: (cx) => {
								if (cx.value !== 'Jeff') {
									cx.registerError({
										code: 'jeff',
										message: 'Only the name Jeff is allowed.'
									});
								}
							}
						}
					])
				),
				defaultValue: ''
			},
			lastName: {
				validationAdapter: valibotNameValidator,
				defaultValue: ''
			},
			gender: {
				validationAdapter: createValidationAdapter([
					{
						key: 'gender',
						validate: (cx) => {
							if (cx.value !== 'female' && cx.value !== 'male' && cx.value !== 'diverse') {
								cx.registerError({
									code: 'invalid-gender',
									message: 'Unknown gender.'
								});
							}
						}
					}
				]) as TFormFieldValidationAdapter<TGender>,
				defaultValue: 'female'
			},
			email: {
				validationAdapter: zodAdapter(z.string().email().max(30).min(1)),
				defaultValue: ''
			},
			image: {
				validationAdapter: createValidationAdapter([
					{
						key: 'color',
						validate: (cx) => {
							const value = cx.value as TFormData['image'] | undefined;
							const color = value?.color;
							if (color != null && !isLightColor(color)) {
								cx.registerError({
									code: 'too-dark',
									message: 'The image is too dark.'
								});
							}
						}
					}
				]),
				defaultValue: {
					id: shortId(),
					color: randomHex()
				}
			}
		},
		onValidSubmit: (data, additionalData) => {
			console.log('ValidSubmit', { data, additionalData });
		},
		onInvalidSubmit: (errors, additionalData) => {
			console.log('Invalid Submit', { errors, additionalData });
		},
		notifyOnStatusChange: false,
		validateMode: bitwiseFlag(FormFieldValidateMode.OnSubmit),
		reValidateMode: bitwiseFlag(FormFieldReValidateMode.OnBlur, FormFieldReValidateMode.OnChange),
		collectErrorMode: 'firstError'
	})
);

let renderCount = 0;

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
				defaultValue={field('gender')._intialValue}
				onChange={(e) =>
					field('gender').set(e.target.value as TGender, {
						additionalData: { background: true }
					})
				}
			>
				<option value={''}>Select...</option>
				<option value="male">Male</option>
				<option value="female">Female</option>
				<option value="diverse">Diverse</option>
			</select>
			<StatusMessage $status={status('gender')} />

			<label>Email:</label>
			<input {...register('email')} />
			<StatusMessage $status={status('email')} />

			<label>Image</label>
			<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
				<div
					style={{
						backgroundColor: field('image').get()?.color,
						width: 100,
						height: 100,
						borderRadius: 100
					}}
				/>
				<button
					style={{ marginLeft: 50 }}
					onClick={(event) => {
						event.preventDefault();
						field('image').set(
							{
								id: shortId(),
								color: randomHex()
							},
							{ additionalData: { background: false } }
						);
					}}
				>
					Generate Color
				</button>
			</div>
			<StatusMessage $status={status('image')} />

			<button type="submit">Submit</button>
			<p>Is Valid: {$form.isValid.toString()}</p>
			<p>Render Count: {renderCount}</p>
			<p>Data: {data}</p>
		</form>
	);
}

export default App;
