import { useFeatureState, useSelector } from 'feature-react/state';
import React from 'react';
import { $counter, $persistentSettings, $userState } from './store';
import { useRenderCount } from './use-render-count';

export default function App() {
	return (
		<div>
			{/* Example 1: Basic counter with undo */}
			<section style={{ marginBottom: '20px', padding: '1rem', border: '1px solid #ccc' }}>
				<h2>Example 1: Counter with Undo</h2>
				<CounterExample />
			</section>

			{/* Example 2: Object state with property selection */}
			<section style={{ marginBottom: '20px', padding: '1rem', border: '1px solid #ccc' }}>
				<h2>Example 2: Property Selection</h2>
				<UserSettingsExample />
			</section>

			{/* Example 3: Persistent state with localStorage */}
			<section style={{ marginBottom: '20px', padding: '1rem', border: '1px solid #ccc' }}>
				<h2>Example 3: Local Storage</h2>
				<PersistentSettingsExample />
			</section>
		</div>
	);
}

// Example 1: Basic counter with undo functionality
function CounterExample() {
	const count = useFeatureState($counter);
	const renderCount = useRenderCount();

	return (
		<div>
			<p>Count: {count}</p>
			<button onClick={() => $counter.set((c) => c + 1)}>+</button>
			<button onClick={() => $counter.set((c) => c - 1)}>-</button>
			<button onClick={() => $counter.undo()}>Undo</button>
			<p>Render Count: {renderCount}</p>
		</div>
	);
}

// Example 2: Demonstrating property selection from "complex" state
function UserSettingsExample() {
	const name = useSelector($userState, 'name');
	const theme = useSelector($userState, 'settings.theme');
	const renderCount = useRenderCount();

	const toggleTheme = () => {
		$userState.set((state) => ({
			...state,
			settings: {
				...state.settings,
				theme: state.settings.theme === 'dark' ? 'light' : 'dark'
			}
		}));
	};

	const toggleNotifications = () => {
		$userState.set((state) => ({
			...state,
			settings: {
				...state.settings,
				notifications: !state.settings.notifications
			}
		}));
	};

	return (
		<div>
			<p>Name: {name}</p>
			<p>Theme: {theme}</p>
			<p>Notifications: {$userState.get().settings.notifications ? 'On' : 'Off'}</p>
			<button onClick={toggleTheme}>Toggle Theme (Will trigger re-render)</button>
			<button onClick={toggleNotifications}>Toggle Notifications (Won't trigger re-render)</button>
			<p>Render Count: {renderCount}</p>
		</div>
	);
}

// Example 3: Demonstrating localStorage persistence
function PersistentSettingsExample() {
	const settings = useFeatureState($persistentSettings);
	const renderCount = useRenderCount();

	React.useEffect(() => {
		$persistentSettings.persist();
	}, []);

	return (
		<div>
			<p>Stored Volume: {settings.volume}</p>
			<p>Stored Language: {settings.language}</p>
			<button
				onClick={() =>
					$persistentSettings.set({ volume: Math.floor(Math.random() * 100), language: 'es' })
				}
			>
				Update Settings
			</button>
			<button onClick={() => $persistentSettings.set({ volume: 50, language: 'en' })}>
				Reset Settings
			</button>
			<button onClick={() => $persistentSettings.deleteFormStorage()}>Delete from Storage</button>
			<p>Render Count: {renderCount}</p>
		</div>
	);
}
