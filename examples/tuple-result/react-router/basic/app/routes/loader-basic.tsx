import { Link, useLoaderData } from 'react-router';
import { Err, Ok, type TResultArray } from 'tuple-result';

export async function loader(): Promise<
	TResultArray<{ id: number; name: string; email: string }, Error>
> {
	await new Promise((resolve) => setTimeout(resolve, 200));

	if (Math.random() < 0.3) {
		return Err(new Error('Request failed')).toArray();
	}

	return Ok({ id: 1, name: 'John Doe', email: 'john@example.com' }).toArray();
}

export default function LoaderExample() {
	const [ok, error, value] = useLoaderData<typeof loader>();

	return (
		<div className="p-8">
			<Link to="/" className="mb-4 block text-blue-600 hover:underline">
				← Back
			</Link>

			<h1 className="mb-4 text-2xl font-bold">React Router Loader Example</h1>
			<p className="mb-6 text-gray-600">
				Shows how to use tuple-result with React Router loaders for clean error handling.
			</p>

			{ok ? (
				<div className="rounded border border-green-300 bg-green-100 p-4">
					<h3 className="mb-2 font-bold text-green-800">✅ Success:</h3>
					<div className="space-y-1 text-green-700">
						<p>
							<strong>Name:</strong> {value.name}
						</p>
						<p>
							<strong>Email:</strong> {value.email}
						</p>
						<p>
							<strong>ID:</strong> {value.id}
						</p>
					</div>
				</div>
			) : (
				<div className="rounded border border-red-300 bg-red-100 p-4">
					<h3 className="mb-2 font-bold text-red-800">❌ Error:</h3>
					<p className="text-red-700">{error.message}</p>
				</div>
			)}

			<div className="mt-6 rounded border border-gray-200 bg-gray-50 p-4">
				<h3 className="mb-2 font-bold">Key Points:</h3>
				<ul className="list-inside list-disc space-y-1 text-sm text-gray-600">
					<li>
						Loader returns <code>result.toArray()</code> for serialization
					</li>
					<li>
						Component destructures <code>[ok, error, value]</code> directly
					</li>
					<li>
						No more <code>.value</code> or <code>.error</code> boilerplate
					</li>
					<li>
						Clean conditional rendering based on <code>ok</code> flag
					</li>
				</ul>
			</div>
		</div>
	);
}
