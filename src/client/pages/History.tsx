import { Head, Link } from "@inertiajs/react";
import Layout from "../components/Layout";

interface Run {
	id: string;
	templateId: string;
	templateName: string;
	roleName: string | null;
	status: "in_progress" | "completed";
	progressPercent: number;
	startedAt: string;
	lastActivityAt: string;
	completedAt: string | null;
}

function dateTime(value: string | null): string {
	if (!value) return "-";
	return new Date(value).toLocaleString("id-ID", {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

export default function History({ runs }: { runs: Run[] }) {
	return (
		<Layout>
			<Head title="Riwayat" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Riwayat Checklist</h1>
			<p className="text-muted mb-6">Hanya menampilkan run milik akun kamu pada organisasi aktif.</p>

			<div className="overflow-x-auto bg-surface border border-border rounded-radius">
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr>
							<th className="text-left p-3 border-b border-border">Checklist</th>
							<th className="text-left p-3 border-b border-border">Status</th>
							<th className="text-left p-3 border-b border-border">Progres</th>
							<th className="text-left p-3 border-b border-border">Aktivitas terakhir</th>
							<th className="text-left p-3 border-b border-border">Selesai</th>
						</tr>
					</thead>
					<tbody>
						{runs.map((run) => (
							<tr key={run.id}>
								<td className="p-3 border-b border-border">
									<Link href={`/checklists/${run.templateId}?run=${run.id}`} className="font-semibold">
										{run.templateName}
									</Link>
									{run.roleName ? <div className="text-xs text-muted mt-0.5">{run.roleName}</div> : null}
								</td>
								<td className="p-3 border-b border-border capitalize">{run.status.replace("_", " ")}</td>
								<td className="p-3 border-b border-border">{run.progressPercent}%</td>
								<td className="p-3 border-b border-border">{dateTime(run.lastActivityAt)}</td>
								<td className="p-3 border-b border-border">{dateTime(run.completedAt)}</td>
							</tr>
						))}
						{runs.length === 0 ? (
							<tr>
								<td colSpan={5} className="p-8 text-center text-muted">
									Belum ada riwayat checklist.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</Layout>
	);
}
