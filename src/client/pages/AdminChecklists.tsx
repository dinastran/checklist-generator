import { Head, Link, router } from "@inertiajs/react";
import Layout from "../components/Layout";

interface TemplateSummary {
	id: string;
	name: string;
	description: string | null;
	status: "draft" | "published" | "archived";
	version: number;
	itemCount: number;
	roleCount: number;
	updatedAt: string;
}

export default function AdminChecklists({
	templates,
}: {
	templates: TemplateSummary[];
}) {
	return (
		<Layout>
			<Head title="Template Checklist" />
			<div className="flex items-start justify-between gap-4 mb-6 max-md:flex-col">
				<div>
					<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Template Checklist</h1>
					<p className="text-muted m-0">Draft tidak terlihat oleh user sampai dipublish.</p>
				</div>
				<Link
					href="/admin/checklists/new"
					className="px-4 py-2.5 rounded-lg border border-primary bg-primary text-white font-semibold hover:no-underline"
				>
					Buat checklist
				</Link>
			</div>

			<div className="grid gap-3">
				{templates.map((template) => (
					<section key={template.id} className="bg-surface border border-border rounded-radius p-5">
						<div className="flex items-start justify-between gap-4 max-md:flex-col">
							<div>
								<div className="flex items-center gap-2 flex-wrap">
									<h2 className="text-lg m-0">{template.name}</h2>
									<span className="text-xs px-2 py-1 rounded-full bg-primary-soft text-primary capitalize">
										{template.status}
									</span>
								</div>
								{template.description ? <p className="text-muted mt-2 mb-0">{template.description}</p> : null}
								<p className="text-xs text-muted mt-2 mb-0">
									{template.itemCount} item · {template.roleCount} role · versi {template.version}
								</p>
							</div>
							<div className="flex gap-2 flex-wrap">
								{template.status === "draft" ? (
									<button
										type="button"
										className="px-3 py-2 rounded-lg border border-primary bg-primary text-white text-sm font-semibold cursor-pointer"
										onClick={() => router.post(`/admin/checklists/${template.id}/publish`)}
									>
										Publish
									</button>
								) : null}
								{template.status !== "archived" ? (
									<button
										type="button"
										className="px-3 py-2 rounded-lg border border-border bg-transparent text-sm cursor-pointer"
										onClick={() => router.post(`/admin/checklists/${template.id}/archive`)}
									>
										Archive
									</button>
								) : null}
							</div>
						</div>
					</section>
				))}
				{templates.length === 0 ? (
					<div className="bg-surface border border-border rounded-radius p-8 text-center text-muted">
						Belum ada template checklist.
					</div>
				) : null}
			</div>
		</Layout>
	);
}
