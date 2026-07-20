import { createApi } from './app';

const api = createApi();
const port = 8787;
const server = api.listen(port, (error) => {
	if (error != null) {
		console.error('Failed to start API Express', error);
		process.exitCode = 1;
		return;
	}

	console.log(`API Express is running at http://localhost:${port.toString()}`);
});

process.once('SIGINT', handleShutdown);
process.once('SIGTERM', handleShutdown);

function handleShutdown(): void {
	server.close((error) => {
		if (error != null) {
			console.error('Failed to shut down API Express', error);
			process.exitCode = 1;
		}
	});
}
