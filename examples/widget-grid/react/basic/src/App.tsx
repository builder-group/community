import { withGlobalBind } from 'feature-react/state';
import React, { useState } from 'react';
import { WidgetGrid } from './components';
import './index.css';
import { TWidgetGridPresetKey, widgetGridPresets } from './widget-grid';

const App: React.FC = () => {
	const [currentWidgetGridPresetKey, setWidgetGridPresetKey] =
		useState<TWidgetGridPresetKey>('playground');

	const preset = React.useMemo(
		() => withGlobalBind('__widgetGrid', widgetGridPresets[currentWidgetGridPresetKey]),
		[currentWidgetGridPresetKey]
	);

	return (
		<div style={{ width: '100%', height: '100vh', backgroundColor: 'blue', padding: '48px' }}>
			<div style={{ marginBottom: '20px' }}>
				<select
					value={currentWidgetGridPresetKey}
					onChange={(e) => setWidgetGridPresetKey(e.target.value as TWidgetGridPresetKey)}
					style={{ marginRight: '10px' }}
				>
					<option value="playground">Playground</option>
					<option value="performance">Performance Test</option>
				</select>

				{preset.actions.map((action, index) => (
					<button
						key={index}
						onClick={() => action.action(preset.grid as any)}
						style={{ marginRight: '10px' }}
					>
						{action.label}
					</button>
				))}
			</div>

			<WidgetGrid
				widgetGrid={preset.grid as any}
				renderItem={(item) => {
					return (
						<div
							style={{
								backgroundColor: 'red',
								width: '100%',
								height: '100%',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								border: '1px solid black'
							}}
						>
							{item.id}
						</div>
					);
				}}
			/>
		</div>
	);
};

export default App;
