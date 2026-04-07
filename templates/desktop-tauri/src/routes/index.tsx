import { createFileRoute, Link } from '@tanstack/react-router';
import { ExampleCard, GreetingCard } from '@/modules/example';

export const Route = createFileRoute('/')({
	component: RouteComponent
});

function RouteComponent() {
	return (
		<main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
			<section className="max-w-3xl">
				<p className="text-sm font-semibold tracking-[0.22em] text-black/45 uppercase">
					Tauri Desktop Template
				</p>
				<h1 className="mt-4 text-5xl leading-none font-bold tracking-tight text-black sm:text-7xl">
					Start simple, then shape the app around real modules.
				</h1>
				<p className="mt-6 max-w-2xl text-base leading-7 text-black/60 sm:text-lg">
					A small starter for desktop apps with routes, environment config, modules, and typed Rust
					bindings already in place.{' '}
					<Link to="/about" className="font-medium text-black underline underline-offset-4">
						Learn more
					</Link>
				</p>
			</section>

			<section className="mt-12 grid gap-4 sm:grid-cols-3">
				<ExampleCard
					title="Routes"
					description="Route files own entry points and screen composition."
				/>
				<ExampleCard
					title="Environment"
					description="App-wide config and runtime setup live in one predictable place."
				/>
				<ExampleCard
					title="Modules"
					description="Product behavior stays close to the module that owns it."
				/>
			</section>

			<GreetingCard />
		</main>
	);
}
