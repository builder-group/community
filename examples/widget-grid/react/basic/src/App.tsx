import { WidgetGrid } from './components';
import { widgetGrid } from './widget-grid';

const App: React.FC = () => {
	return (
		<div>
			<WidgetGrid widgetGrid={widgetGrid} />
		</div>
	);
};

export default App;
