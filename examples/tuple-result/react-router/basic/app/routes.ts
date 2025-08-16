import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
	route('loader-basic', 'routes/loader-basic.tsx')
] satisfies RouteConfig;
