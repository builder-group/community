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
		</div>
	);
};

export default App;
