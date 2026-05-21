import {
	createForm,
	dirtyFeature,
	type TFormFieldKey,
	type TValidationStatusValue
} from 'feature-form';
import { useFormField } from 'feature-react/form';
import { useFeatureState } from 'feature-react/state';
import React from 'react';
import * as z from 'zod';
import './App.css';

const $form = createForm<TFormData>({
	fields: {
		firstName: {
			defaultValue: '',
			validator: z.string().min(2, 'Enter at least two characters')
		},
		email: {
			defaultValue: '',
			validator: z.email('Enter a valid email')
		},
		age: {
			defaultValue: 18,
			validator: z.number().min(18, 'You must be at least 18')
		},
		role: {
			defaultValue: 'reader',
			validator: z.enum(['reader', 'admin'])
		}
	},
	validator: z.custom<TFormData>(
		(value) => {
			const data = value as TFormData;
			return data.role !== 'admin' || data.age >= 21;
		},
		{
			error: 'Admins must be at least 21',
			path: ['age']
		}
	),
	validateOn: ['submit'],
	revalidateOn: ['change', 'blur', 'submit']
}).with(dirtyFeature<TFormData>());

interface TFormData {
	firstName: string;
	email: string;
	age: number;
	role: TRole;
}

type TRole = 'reader' | 'admin';

export const App: React.FC = () => {
	const [submittedData, setSubmittedData] = React.useState<Readonly<TFormData> | null>(null);

	const handleSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void $form.submit({
			onValidSubmit(data) {
				setSubmittedData(data);
			}
		});
	}, []);

	const handleReset = React.useCallback(() => {
		$form.reset();
		setSubmittedData(null);
	}, []);

	return (
		<main className="app">
			<header>
				<h1>feature-form React basic</h1>
				<p>
					Per-field subscriptions with Standard Schema validation, dirty tracking, and visible
					render counts.
				</p>
				<RenderCount label="App" />
			</header>

			<form onReset={handleReset} onSubmit={handleSubmit}>
				<ExampleSection title="Fields">
					<div className="field-grid">
						<FirstNameField />
						<EmailField />
						<AgeField />
						<RoleField />
					</div>
				</ExampleSection>

				<ExampleSection title="Form state">
					<FormStateExample />
				</ExampleSection>

				<ExampleSection title="Submit">
					<div className="actions">
						<button type="submit">Submit</button>
						<button type="reset">Reset</button>
					</div>
					{submittedData == null ? null : <pre>{JSON.stringify(submittedData, null, 2)}</pre>}
				</ExampleSection>
			</form>
		</main>
	);
};

const FormStateExample: React.FC = () => {
	const formStatus = useFeatureState($form.status);
	const isDirty = useFeatureState($form.isDirty);
	const dirtyFields = useFeatureState($form.dirtyFields);

	return (
		<div className="stack">
			<RenderCount label="FormStateExample" />
			<p>Status: {formStatus.type}</p>
			<p>Dirty: {isDirty ? 'yes' : 'no'}</p>
			<p>Dirty fields: {JSON.stringify(dirtyFields)}</p>
		</div>
	);
};

const FirstNameField: React.FC = () => {
	const { input, status } = useFormField($form, 'firstName');

	return (
		<FieldRow fieldKey="firstName" label="First name" renderLabel="FirstNameField" status={status}>
			<input {...input()} id="firstName" />
		</FieldRow>
	);
};

const EmailField: React.FC = () => {
	const { input, status } = useFormField($form, 'email');

	return (
		<FieldRow fieldKey="email" label="Email" renderLabel="EmailField" status={status}>
			<input {...input()} id="email" />
		</FieldRow>
	);
};

const AgeField: React.FC = () => {
	const { input, status } = useFormField($form, 'age', {
		format: (value) => String(value),
		parse: (value) => Number(value)
	});

	return (
		<FieldRow fieldKey="age" label="Age" renderLabel="AgeField" status={status}>
			<input {...input()} id="age" type="number" />
		</FieldRow>
	);
};

const RoleField: React.FC = () => {
	const { input, status } = useFormField($form, 'role', {
		format: (value) => value,
		parse: (value) => (value === 'admin' ? 'admin' : 'reader')
	});

	return (
		<FieldRow fieldKey="role" label="Role" renderLabel="RoleField" status={status}>
			<select {...input()} id="role">
				<option value="reader">Reader</option>
				<option value="admin">Admin</option>
			</select>
		</FieldRow>
	);
};

const FieldRow: React.FC<TFieldRowProps> = (props) => {
	const { children, fieldKey, label, renderLabel, status } = props;

	return (
		<div className="field-row">
			<label htmlFor={children.props.id}>{label}</label>
			{children}
			<StatusMessage status={status} />
			<small>Field key: {fieldKey}</small>
			<RenderCount label={renderLabel} />
		</div>
	);
};

interface TFieldRowProps {
	children: React.ReactElement<{ id: string }>;
	fieldKey: TFormFieldKey<TFormData>;
	label: string;
	renderLabel: string;
	status: TValidationStatusValue;
}

const StatusMessage: React.FC<TStatusMessageProps> = (props) => {
	const { status } = props;

	if (status.type !== 'invalid') {
		return <small>No error</small>;
	}

	return <small role="alert">{status.errors[0].message}</small>;
};

interface TStatusMessageProps {
	status: TValidationStatusValue;
}

const ExampleSection: React.FC<TExampleSectionProps> = (props) => {
	const { children, title } = props;

	return (
		<section className="section">
			<h2>{title}</h2>
			{children}
		</section>
	);
};

interface TExampleSectionProps {
	children: React.ReactNode;
	title: string;
}

const RenderCount: React.FC<TRenderCountProps> = (props) => {
	const { label } = props;
	const renderCount = useRenderCount();

	return (
		<small className="render-count">
			{label} renders: {renderCount}
		</small>
	);
};

interface TRenderCountProps {
	label: string;
}

function useRenderCount(): number {
	const renderCount = React.useRef(0);
	// eslint-disable-next-line react-hooks/refs -- this diagnostic helper intentionally counts render passes
	renderCount.current++;

	// eslint-disable-next-line react-hooks/refs -- render count is displayed for the example UI
	return renderCount.current;
}

export default App;
