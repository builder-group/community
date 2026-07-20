import { createApi } from '../src';

const api = createApi();
const port = 8787;

api.listen(port, () => {
	console.log(`API Express is running at http://localhost:${port.toString()}`);
});
