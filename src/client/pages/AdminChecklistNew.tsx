import { Head, Link, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import Field, { inputClass } from "../components/Field";

interface RoleOption {
	id: string;
	name: string;
}

export default function AdminChecklistNew({ roles }: { roles: RoleOption[] }) {
	const { data, setData, post, processing, errors } = useForm({
		name: "",
		description: "",
		roleIds: [] as string[],
		items: [{ title: "", description: "" }],
	});

	const submit = (event: FormEvent) => {
		event.preventDefault();
		post("/admin/checklists");
	};

	const toggleRole = (roleId: string) => {
		setData(
			"roleIds",
			data.roleIds.includes(roleId)
				? data.roleIds.filter((id) => id !== roleId)
				: [...data.roleIds, roleId],
		);
	};

	return (
		<Layout>
			<Head title="Buat Checklist" />
			<div className="flex items-center justify-between gap-4 mb-6">
				<div>
					<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Buat checklist</h1>
					<p className="text-muted m-0">Checklist disimpan sebagai draft terlebih dahulu.</p>
				</div>
				<Link href="/admin/checklists">Kembali</Link>
			</div>

			<form onSubmit={submit} className="grid gap-5" noValidate>
				<section className="bg-surface border border-border rounded-radius p-5">
					<Field id="checklist-name" label="Nama checklist" error={errors.name}>
						<input
							id="checklist-name"
							className={inputClass}
							value={data.name}
							onChange={(event) => setData("name", event.target.value)}
						/>
					</Field>
					<Field id="checklist-description" label="Deskripsi" error={errors.description}>
						<textarea
							id="checklist-description"
							className={inputClass}
							rows={3}
							value={data.description}
							onChange={(event) => setData("description", event.target.value)}
						/>
					</Field>
				</section>

				<section className="bg-surface border border-border rounded-radius p-5">
					<h2 className="text-lg mt-0 mb-3">Role target</h2>
					<div className="grid gap-2">
						{roles.map((role) => (
							<label key={role.id} className="flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer">
								<input
									type="checkbox"
									checked={data.roleIds.includes(role.id)}
									onChange={() => toggleRole(role.id)}
								/>
								<span>{role.name}</span>
							</label>
						))}
					</div>
					{errors.roleIds ? <p className="text-sm text-danger mt-2">{errors.roleIds}</p> : null}
					{roles.length === 0 ? (
						<p className="text-sm text-muted">
							Belum ada role aktif. Buat role operasional terlebih dahulu.
						</p>
					) : null}
				</section>

				<section className="bg-surface border border-border rounded-radius p-5">
					<div className="flex items-center justify-between gap-3 mb-3">
						<h2 className="text-lg m-0">Item checklist</h2>
						<button
							type="button"
							className="px-3 py-2 rounded-lg border border-border bg-transparent text-sm cursor-pointer"
							onClick={() => setData("items", [...data.items, { title: "", description: "" }])}
						>
							Tambah item
						</button>
					</div>
					<div className="grid gap-3">
						{data.items.map((item, index) => (
							<div key={`item-${index + 1}`} className="grid grid-cols-[40px_1fr_auto] gap-3 items-start max-md:grid-cols-[32px_1fr]">
								<div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm">
									{index + 1}
								</div>
								<div className="grid gap-2">
									<input
										className={inputClass}
										placeholder="Judul item"
										value={item.title}
										onChange={(event) => {
											const next = [...data.items];
											next[index] = { ...item, title: event.target.value };
											setData("items", next);
										}}
									/>
									<textarea
										className={inputClass}
										placeholder="Instruksi opsional"
										rows={2}
										value={item.description}
										onChange={(event) => {
											const next = [...data.items];
											next[index] = { ...item, description: event.target.value };
											setData("items", next);
										}}
									/>
								</div>
								<button
									type="button"
									disabled={data.items.length === 1}
									className="px-3 py-2 rounded-lg border border-border bg-transparent text-sm cursor-pointer disabled:opacity-40 max-md:col-start-2"
									onClick={() => setData("items", data.items.filter((_, itemIndex) => itemIndex !== index))}
								>
									Hapus
								</button>
							</div>
						))}
					</div>
					{errors.items ? <p className="text-sm text-danger mt-2">{errors.items}</p> : null}
				</section>

				<button
					type="submit"
					disabled={processing || roles.length === 0}
					className="justify-self-start px-5 py-2.5 rounded-lg border border-primary bg-primary text-white font-semibold disabled:opacity-60"
				>
					{processing ? "Menyimpan…" : "Simpan sebagai draft"}
				</button>
			</form>
		</Layout>
	);
}
