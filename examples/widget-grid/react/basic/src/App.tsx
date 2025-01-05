import { createWidgetGrid } from 'widget-grid';
import { WidgetGrid } from './components';

const widgetGrid = createWidgetGrid({
	grid: [
		['1', '2', '3', '4'],
		['5', '6', '3', '7'],
		['8', '8', '9', '0']
	],
	widgets: {
		'1': { id: '1', type: 'widget1' },
		'2': { id: '2', type: 'widget2' },
		'3': { id: '3', type: 'widget3' },
		'4': { id: '4', type: 'widget4' },
		'5': { id: '5', type: 'widget5' },
		'6': { id: '6', type: 'widget6' },
		'7': { id: '7', type: 'widget7' },
		'8': { id: '8', type: 'widget8' },
		'9': { id: '9', type: 'widget9' },
		'0': { id: '0', type: 'widget0' }
	},
	columns: 4,
	rows: 3
});

const App: React.FC = () => {
	return (
		<div>
			<WidgetGrid widgetGrid={widgetGrid} />
		</div>
	);
};

export default App;
