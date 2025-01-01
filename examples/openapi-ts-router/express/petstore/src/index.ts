import express from 'express';
import { errorMiddleware, invalidPathMiddleware } from './middlewares';
import { router } from './router';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/*', router);

app.use(invalidPathMiddleware);
app.use(errorMiddleware);

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port.toString()}`);
});
