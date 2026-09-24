import { Head, Link } from "@inertiajs/react";
import Layout from "../components/Layout";

interface TemplateRow {
	id: string;
	name: string;
	description: string | null;
	version: number;
	roleNames: string;
}

export default function Checklists({ templates }: { templates: TemplateRow[] }) {
	return (
		<Layout>
			<Head title="Checklist Saya" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Checklist Saya</h1>
			<p className="text-muted mb-6">
				Checklist published yang sesuai dengan role aktif kamu.
			</p>

			<div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
				{templates.map((template) => (
					<Link
						key={template.id}
						href={`/checklists/${template.id}`}
						className="block bg-surface border border-border rounded-radius p-5 text-text hover:no-underline hover:border-primary transition-colors"
					>
						<h2 className="text-lg m-0 mb-2">{template.name}</h2>
						{template.description ? (
							<p className="text-sm text-muted m-0 mb-4">{template.description}</p>
						) : null}
						<div className="text-xs text-muted">
							Role: {template.roleNames || "-"} · versi {template.version}
						</div>
					</Link>
				))}
			</div>

			{templates.length === 0 ? (
				<div className="bg-surface border border-border rounded-radius p-8 text-center">
					<h2 className="text-lg mt-0 mb-2">Belum ada checklist aktif</h2>
					<p className="text-muted m-0">
						Checklist akan muncul setelah Admin mem-publish template untuk role kamu.
					</p>
				</div>
			) : null}
		</Layout>
	);
}
