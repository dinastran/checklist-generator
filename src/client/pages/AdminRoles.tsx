import { Head, router, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import Field, { inputClass } from "../components/Field";

interface RoleRow {
	id: string;
	name: string;
	description: string | null;
	isSystem: number;
	status: "active" | "inactive";
	userCount: number;
	templateCount: number;
}

export default function AdminRoles({ roles }: { roles: RoleRow[] }) {
	const { data, setData, post, processing, errors, reset, clearErrors } =
		useForm({ name: "", description: "" });

	const submit = (event: FormEvent) => {
		event.preventDefault();
		post("/admin/roles", {
			onSuccess: () => reset(),
		});
	};

	return (
		<Layout>
			<Head title="Role" />
			<div className="flex items-start justify-between gap-4 mb-6 max-md:flex-col">
				<div>
					<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Role</h1>
					<p className="text-muted m-0">
						Atur kelompok tanggung jawab yang akan menerima checklist.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-5 max-lg:grid-cols-1">
				<section className="bg-surface border border-border rounded-radius p-5 overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr>
								<th className="text-left p-2 border-b border-border">Role</th>
								<th className="text-left p-2 border-b border-border">Status</th>
								<th className="text-left p-2 border-b border-border">User</th>
								<th className="text-left p-2 border-b border-border">Template</th>
								<th className="text-right p-2 border-b border-border">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{roles.map((role) => (
								<tr key={role.id}>
									<td className="p-2 border-b border-border">
										<div className="font-semibold">{role.name}</div>
										{role.description ? (
											<div className="text-xs text-muted mt-0.5">{role.description}</div>
										) : null}
									</td>
									<td className="p-2 border-b border-border capitalize">{role.status}</td>
									<td className="p-2 border-b border-border">{role.userCount}</td>
									<td className="p-2 border-b border-border">{role.templateCount}</td>
									<td className="p-2 border-b border-border text-right">
										{role.isSystem ? (
											<span className="text-xs text-muted">System role</span>
										) : (
											<button
												type="button"
												className="px-3 py-1.5 border border-border rounded-lg bg-transparent text-sm cursor-pointer"
												onClick={() =>
													router.post(
														`/admin/roles/${role.id}/${role.status === "active" ? "deactivate" : "activate"}`,
													)
												}
											>
												{role.status === "active" ? "Nonaktifkan" : "Aktifkan"}
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>

				<section className="bg-surface border border-border rounded-radius p-5">
					<h2 className="text-lg mt-0 mb-4">Tambah role</h2>
					<form onSubmit={submit} noValidate>
						<Field id="role-name" label="Nama role" error={errors.name}>
							<input
								id="role-name"
								className={inputClass}
								value={data.name}
								onChange={(event) => {
									clearErrors("name");
									setData("name", event.target.value);
								}}
							/>
						</Field>
						<Field id="role-description" label="Deskripsi" error={errors.description}>
							<textarea
								id="role-description"
								className={inputClass}
								rows={3}
								value={data.description}
								onChange={(event) => setData("description", event.target.value)}
							/>
						</Field>
						<button
							type="submit"
							disabled={processing}
							className="w-full px-4 py-2.5 rounded-lg border border-primary bg-primary text-white font-semibold disabled:opacity-60"
						>
							{processing ? "Menyimpan…" : "Simpan role"}
						</button>
					</form>
				</section>
			</div>
		</Layout>
	);
}
