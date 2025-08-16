import { Welcome } from '../welcome/welcome';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'Tuple Result - React Router Demo' },
		{ name: 'description', content: 'Showcasing tuple-result with React Router loaders' }
	];
}

export default function Home() {
	return <Welcome />;
}
