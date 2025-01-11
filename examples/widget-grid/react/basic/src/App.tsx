import { WidgetGrid } from './components';
import './index.css';
import { TWidgetContent, widgetGrid } from './widget-grid';

const App: React.FC = () => {
	return (
		<div style={{ width: '100%', height: '100vh', backgroundColor: 'blue', padding: '48px' }}>
			<WidgetGrid<TWidgetContent>
				widgetGrid={widgetGrid}
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
			<button
				onClick={() => {
					widgetGrid.grid.set([
						['3', '3', '5', '1'],
						['3', '3', '5', '1'],
						['2', '2', '4', '4']
					]);
				}}
			>
				Reshuffle
			</button>
		</div>
	);
};

export default App;
