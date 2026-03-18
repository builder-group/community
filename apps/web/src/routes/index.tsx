import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import React from 'react';
import { CanvasButton, CanvasFrame, StatusBadge, TagList } from '@/components';
import { appConfig, projectsConfig, type TProject, type TProjectLogo } from '@/environment';
import { formatNpmDownloads, formatProjectDate, getNpmTotalDownloads } from '@/lib';

export const Route = createFileRoute('/')({
	component: RouteComponent,
	head: () => ({
		meta: [
			{ title: 'builder.group — Indie Software Studio' },
			{
				name: 'description',
				content:
					'builder.group is an indie software studio shipping SaaS products and open-source TypeScript libraries in public. Home of Saku, FocusCat, Kairos, Tapling, feature-fetch, ecsify, and more.'
			},
			{ property: 'og:title', content: 'builder.group — Indie Software Studio' },
			{
				property: 'og:description',
				content:
					'An indie software studio shipping SaaS products and open-source TypeScript libraries in public. Home of Saku, FocusCat, Kairos, Tapling, feature-fetch, ecsify, and more.'
			}
		]
	}),
	loader: async () => {
		const npmDownloads = await fetchNpmDownloads();
		return { npmDownloads };
	},
	staleTime: Infinity
});

function RouteComponent() {
	const { npmDownloads } = Route.useLoaderData();

	// const statusOrder = React.useMemo(
	// 	() => ({
	// 		'in-progress': 0,
	// 		'maintenance': 1,
	// 		'paused': 2,
	// 		'completed': 3,
	// 		'pivoted': 4,
	// 		'discontinued': 5
	// 	}),
	// 	[]
	// );

	const saasProjects = projectsConfig.projects
		.filter((p) => p.category === 'saas')
		.sort((a, b) => {
			// const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
			// if (statusDiff !== 0) return statusDiff;
			const aDate = a.startedAt.year * 12 + (a.startedAt.month ?? 0);
			const bDate = b.startedAt.year * 12 + (b.startedAt.month ?? 0);
			return bDate - aDate;
		});
	const packages = projectsConfig.projects
		.filter((p) => p.category === 'package')
		.sort((a, b) => (npmDownloads[b.name] ?? 0) - (npmDownloads[a.name] ?? 0));

	return (
		<div
			className="bg-base-200 min-h-screen"
			style={
				{
					'--canvas-bg': 'var(--color-base-200)',
					'backgroundImage': 'radial-gradient(circle, rgba(0,0,0,0.07) 1px, transparent 1px)',
					'backgroundSize': '24px 24px'
				} as React.CSSProperties
			}
		>
			<div className="mx-auto flex max-w-4xl flex-col gap-20 px-8 py-24">
				{/* Header */}
				<CanvasFrame label="builder.group">
					<div className="bg-base-100 px-10 py-10">
						<img
							src="/illustrations/logos/builder-group.png"
							alt="builder.group"
							className="mb-5 h-14 w-14 rounded-xl"
						/>
						<h1 className="text-base-950 mb-5 font-serif text-4xl font-bold tracking-tight">
							builder.group
						</h1>
						<p className="text-base-500 mb-8 max-w-sm text-base">
							An indie software studio shipping products and open-source tools in public.
						</p>
						<div className="flex gap-3">
							<CanvasButton
								href={appConfig.help.discord}
								target="_blank"
								rel="noopener noreferrer"
								variant="primary"
							>
								Join Discord
							</CanvasButton>
							<CanvasButton
								href={appConfig.social.github}
								target="_blank"
								rel="noopener noreferrer"
								variant="outline"
							>
								GitHub
							</CanvasButton>
						</div>
					</div>
				</CanvasFrame>

				{/* Projects */}
				<CanvasFrame label="Projects">
					<div className="bg-base-300 flex flex-col gap-px">
						<div className="bg-base-100 px-5 py-3">
							<p className="text-base-500 text-sm">
								Products built under{' '}
								<a
									href={appConfig.social.github}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-base-800 underline underline-offset-2"
								>
									builder.group
								</a>
								, from experiments to production
							</p>
						</div>
						<div className="bg-base-300 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
							{saasProjects.map((project) => (
								<ProjectCell key={project.id} project={project} />
							))}
						</div>
					</div>
				</CanvasFrame>

				{/* Packages */}
				<CanvasFrame label="Packages">
					<div className="bg-base-300 flex flex-col gap-px">
						<div className="bg-base-100 px-5 py-3">
							<p className="text-base-500 text-sm">
								TypeScript libraries in the{' '}
								<a
									href={`${appConfig.social.github}/community`}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:text-base-800 underline underline-offset-2"
								>
									community monorepo
								</a>
							</p>
						</div>
						{packages.map((pkg) => (
							<PackageRow key={pkg.id} project={pkg} downloads={npmDownloads[pkg.name]} />
						))}
					</div>
				</CanvasFrame>

				{/* Footer */}
				<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pb-4">
					<span className="text-base-600 text-sm">Built in Europe 🇪🇺</span>
					<span className="text-base-400 text-sm">|</span>
					<span className="text-base-600 text-sm">
						by{' '}
						<a
							href="https://x.com/bennobuilder"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-base-900 transition-colors"
						>
							@bennobuilder
						</a>
					</span>
					<span className="text-base-400 text-sm">|</span>
					<a
						href="mailto:hello@builder.group"
						className="text-base-600 hover:text-base-900 text-sm transition-colors"
					>
						hello@builder.group
					</a>
				</div>
			</div>
		</div>
	);
}

// MARK: - Server Functions

const fetchNpmDownloads = createServerFn().handler(async () => {
	const packageNames = projectsConfig.projects
		.filter((p) => p.category === 'package')
		.map((p) => p.name);
	return getNpmTotalDownloads(packageNames);
});

// MARK: - ProjectLogo

const ProjectLogo: React.FC<TProjectLogoProps> = (props) => {
	const { logo, name } = props;

	if (logo?.type === 'image') {
		return (
			<img
				src={logo.src}
				alt={name}
				className="ring-base-300 h-12 w-12 shrink-0 rounded-lg object-cover ring-1"
			/>
		);
	}

	if (logo?.type === 'emoji') {
		return (
			<div className="bg-base-200 ring-base-300 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl ring-1">
				{logo.value}
			</div>
		);
	}

	return (
		<div className="bg-base-200 text-base-400 ring-base-300 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ring-1">
			{name[0]}
		</div>
	);
};

interface TProjectLogoProps {
	logo?: TProjectLogo;
	name: string;
}

// MARK: - ProjectCell

const ProjectCell: React.FC<TProjectCellProps> = (props) => {
	const { project } = props;
	const isLab = project.tags.some((t) => t.type === 'lab');

	return (
		<div className="bg-base-100 flex flex-col gap-3 p-5">
			<div className="flex items-start gap-3">
				<ProjectLogo logo={project.logo} name={project.name} />
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="text-base-950 font-medium">
							{project.name}
							{isLab && (
								<a
									href={`${appConfig.social.github}/lab`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-base-950 group ml-1 text-[13px]"
								>
									[
									<span className="inline-block text-[10px] transition-transform group-hover:-translate-y-0.5">
										🧪
									</span>
									]
								</a>
							)}
						</span>
					</div>
					<div className="mt-0.5 flex flex-wrap items-center gap-1.5">
						<StatusBadge status={project.status} />
						<span className="bg-base-200 text-base-500 rounded-full px-2 py-1 font-mono text-[11px] leading-none">
							{formatProjectDate(project.startedAt)}
							{/* {project.endedAt != null ? `–${formatProjectDate(project.endedAt)}` : ''} */}
						</span>
					</div>
				</div>
			</div>
			<p className="text-base-500 text-sm leading-relaxed">{project.description}</p>
			<TagList tags={project.tags} />
		</div>
	);
};

interface TProjectCellProps {
	project: TProject;
}

// MARK: - PackageRow

const PackageRow: React.FC<TPackageRowProps> = (props) => {
	const { project, downloads } = props;

	return (
		<div className="bg-base-100 flex flex-col gap-1.5 px-5 py-3.5">
			<div className="flex min-w-0 items-center justify-between gap-4">
				<span className="bg-primary text-primary-content min-w-0 truncate rounded px-1.5 py-0.5 font-mono text-sm font-semibold">
					{project.name}
				</span>
				<div className="flex shrink-0 items-center gap-2">
					{downloads != null && (
						<span className="text-base-400 font-mono text-[11px]">
							↓ {formatNpmDownloads(downloads)}
						</span>
					)}
					<TagList tags={project.tags} />
				</div>
			</div>
			<p className="text-base-500 text-sm">{project.description}</p>
		</div>
	);
};

interface TPackageRowProps {
	project: TProject;
	downloads?: number;
}
