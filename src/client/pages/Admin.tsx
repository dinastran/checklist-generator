import { Head, Link } from "@inertiajs/react";
import Layout from "../components/Layout";
import type { Paginated, User } from "../../shared/types";

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString("id-ID", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function pageUrl(page: number): string {
	return `/admin?page=${page}`;
}

export default function Admin({ users }: { users: Paginated<User> }) {
	const { currentPage, lastPage } = users.meta;
	const btnGhost =
		"inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border rounded-lg bg-transparent text-text font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-soft hover:no-underline";

	return (
		<Layout>
			<Head title="Admin" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Admin</h1>
			<p className="text-muted mb-3">
				{users.meta.total} anggota aktif, halaman {currentPage} dari {lastPage}.
			</p>

			<section className="bg-surface border border-border rounded-radius p-6">
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
							{users.data.map((user) => (
								<tr
									key={user.id}
									className="transition-colors hover:bg-primary-soft"
								>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{user.name}
									</td>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{user.email}
									</td>
									<td className="text-left px-3 py-2.5 border-b border-border whitespace-nowrap">
										{formatDate(user.createdAt)}
									</td>
								</tr>
							))}
							{users.data.length === 0 ? (
								<tr>
									<td colSpan={3} className="text-center text-muted p-6">
										Belum ada anggota aktif.
									</td>
								</tr>
							) : null}
						</tbody>
					</table>
				</div>
			</section>

			<nav
				className="flex items-center justify-between gap-4 mt-4"
				aria-label="Pagination"
			>
				{currentPage > 1 ? (
					<Link href={pageUrl(currentPage - 1)} className={btnGhost}>
						Sebelumnya
					</Link>
				) : (
					<span
						className={`${btnGhost} opacity-35 cursor-not-allowed`}
						aria-disabled="true"
					>
						Sebelumnya
					</span>
				)}
				<span className="text-muted text-sm">
					Halaman {currentPage} dari {lastPage}
				</span>
				{currentPage < lastPage ? (
					<Link href={pageUrl(currentPage + 1)} className={btnGhost}>
						Berikutnya
					</Link>
				) : (
					<span
						className={`${btnGhost} opacity-35 cursor-not-allowed`}
						aria-disabled="true"
					>
						Berikutnya
					</span>
				)}
			</nav>
		</Layout>
	);
}
