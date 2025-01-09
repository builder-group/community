import { WidgetGrid } from './components';
import { TWidgetContent, widgetGrid } from './widget-grid';

const App: React.FC = () => {
	return (
		<div>
			<WidgetGrid<TWidgetContent>
				widgetGrid={widgetGrid}
				cellSize={96}
				renderItem={(item) => {
					console.log({ item });
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
