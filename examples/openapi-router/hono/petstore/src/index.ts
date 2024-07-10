import { serve } from '@hono/node-server';
import { zValidator } from '@hono/zod-validator';
import { Context, Hono } from 'hono';
import { BlankEnv, HandlerResponse, ToSchema, TypedResponse } from 'hono/types';
import * as z from 'zod';

const app = new Hono();

type TTestContext = Context<
	BlankEnv,
	'/',
	{
		in: {
			param: {
				jeff: string;
			};
		};
	}
>;

app.get('/', (c: TTestContext) => {
	// c.req.param()
	return c.json({});
});

const route = app.post(
	'/posts',
	// zValidator(
	// 	'form',
	// 	z.object({
	// 		form: z.string()
	// 	})
	// ),
	// zValidator(
	// 	'header',
	// 	z.object({
	// 		header: z.string()
	// 	})
	// ),
	zValidator(
		'query',
		z.object({
			query: z.string()
		})
	),
	// zValidator(
	// 	'cookie',
	// 	z.object({
	// 		cookie: z.string()
	// 	})
	// ),
	zValidator(
		'json',
		z.object({
			json: z.string()
		})
	),
	zValidator(
		'param',
		z.object({
			param: z.string()
		})
	),
	(c) => {
		// c.req.valid('query');
		// c.req.valid('json');
		// ...
		return c.json(
			{
				ok: true,
				message: 'Created!'
			},
			201
		);
	}
);

export type AppType = typeof route;

const app2 = new Hono<
	BlankEnv,
	{
		'/jeff': {
			$get: {
				input: {};
				output: {};
				outputFormat: 'json';
				status: 200;
			};
		};
	},
	'/'
>();

type MergeTypedResponse<T> =
	T extends Promise<infer T2>
		? T2 extends TypedResponse
			? T2
			: TypedResponse
		: T extends TypedResponse
			? T
			: TypedResponse;

type TTestSchema = ToSchema<'get', '/jeff', {}, MergeTypedResponse<HandlerResponse<any>>>;

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port
});
