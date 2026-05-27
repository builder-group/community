import { localStorageFeature, useCompute, useFeatureState } from 'feature-react/state';
import { createState, undoFeature } from 'feature-state';
import React from 'react';
import './App.css';

const $count = createState(0).with(undoFeature());

const $profile = createState({
	name: 'Ada',
	role: 'editor'
});

const $settings = createState({
	theme: 'light',
	compact: false
}).with(localStorageFeature('feature-state-react-basic-settings'));

export const App: React.FC = () => {
	return (
		<main className="app">
			<header>
				<h1>feature-state React basic</h1>
				<p>
					Small examples for `useFeatureState`, `useCompute`, feature chaining, and render scoping.
				</p>
				<RenderCount label="App" />
			</header>

			<div className="grid">
				<ExampleSection title="State value">
					<CounterExample />
				</ExampleSection>

				<ExampleSection title="Computed values">
					<ProfileExample />
				</ExampleSection>

				<ExampleSection title="Persistent feature">
					<SettingsExample />
				</ExampleSection>
			</div>
		</main>
	);
};

const CounterExample: React.FC = () => {
	const count = useFeatureState($count);
	const doubled = useCompute($count, (value) => value * 2);

	return (
		<div className="stack">
			<RenderCount label="CounterExample" />
			<p>Count: {count}</p>
			<p>Doubled: {doubled}</p>
			<div className="actions">
				<button type="button" onClick={() => $count.set((value) => value + 1)}>
					Increment
				</button>
				<button type="button" onClick={() => $count.set((value) => value - 1)}>
					Decrement
				</button>
				<button type="button" onClick={() => $count.undo()}>
					Undo
				</button>
			</div>
		</div>
	);
};

const ProfileExample: React.FC = () => {
	const profile = useFeatureState($profile);
	const summary = useCompute([$count, $profile], ([count, profile]) => {
		return `${profile.name} changed the counter ${count} ${count === 1 ? 'time' : 'times'}`;
	});

	return (
		<div className="stack">
			<RenderCount label="ProfileExample" />
			<label>
				Name
				<input
					value={profile.name}
					onChange={(event) =>
						$profile.set((value) => ({
							...value,
							name: event.currentTarget.value
						}))
					}
				/>
			</label>
			<label>
				Role
				<select
					value={profile.role}
					onChange={(event) =>
						$profile.set((value) => ({
							...value,
							role: event.currentTarget.value
						}))
					}
				>
					<option value="editor">Editor</option>
					<option value="viewer">Viewer</option>
				</select>
			</label>
			<p>{summary}</p>
		</div>
	);
};

const SettingsExample: React.FC = () => {
	const settings = useFeatureState($settings);

	React.useEffect(() => {
		void $settings.persist();
	}, []);

	return (
		<div className="stack">
			<RenderCount label="SettingsExample" />
			<p>Theme: {settings.theme}</p>
			<p>Compact: {settings.compact ? 'yes' : 'no'}</p>
			<div className="actions">
				<button
					type="button"
					onClick={() =>
						$settings.set((value) => ({
							...value,
							theme: value.theme === 'light' ? 'dark' : 'light'
						}))
					}
				>
					Toggle theme
				</button>
				<button
					type="button"
					onClick={() =>
						$settings.set((value) => ({
							...value,
							compact: !value.compact
						}))
					}
				>
					Toggle compact
				</button>
				<button type="button" onClick={() => void $settings.deleteFromStorage()}>
					Clear storage
				</button>
			</div>
		</div>
	);
};

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
