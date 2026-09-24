import { Head, usePage } from "@inertiajs/react";
import Layout from "../components/Layout";
import type {
	DashboardStats,
	OrganizationContext,
} from "../../shared/types";

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("id-ID", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export default function Dashboard({
	stats,
	organization,
}: {
	stats: DashboardStats;
	organization: OrganizationContext;
}) {
	const { props } = usePage();
	const user = props.auth.user;
	if (!user) return null;

	return (
		<Layout>
			<Head title="Dashboard" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Dashboard</h1>
			<p className="text-muted mb-3">
				{user.email} aktif di organisasi <strong>{organization.name}</strong>.
			</p>

			<section className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 my-6">
				<div className="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1">
					<span className="text-xl font-bold">{stats.userCount}</span>
					<span className="text-[0.82rem] text-muted">Anggota aktif</span>
				</div>
				<div className="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1">
					<span className="text-xl font-bold">
						{organization.isAdmin ? "Admin" : "Member"}
					</span>
					<span className="text-[0.82rem] text-muted">Akses organisasi</span>
				</div>
				<div className="bg-surface border border-border rounded-radius p-5 flex flex-col items-start gap-1">
					<span className="text-xl font-bold">{organization.timezone}</span>
					<span className="text-[0.82rem] text-muted">Timezone organisasi</span>
				</div>
			</section>

			<section className="bg-surface border border-border rounded-radius p-6">
				<h2 className="text-[1.1rem] m-0 mb-3">Anggota terbaru</h2>
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg">
									Nama
								</th>
								<th className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg">
									Email
								</th>
								<th className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap text-muted text-xs uppercase tracking-wider bg-bg">
									Akun dibuat
								</th>
							</tr>
						</thead>
						<tbody className="[&>tr:last-child>td]:border-b-0">
							{stats.recentUsers.map((recentUser) => (
								<tr
									key={recentUser.id}
									className="transition-colors hover:bg-primary-soft"
								>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{recentUser.name}
									</td>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{recentUser.email}
									</td>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{formatDate(recentUser.createdAt)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</Layout>
	);
}
