import { Head, router, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import Field, { inputClass } from "../components/Field";

interface RoleOption {
	id: string;
	name: string;
}

interface MemberRow {
	membershipId: string;
	userId: number;
	name: string;
	email: string;
	userStatus: "active" | "inactive";
	membershipStatus: "active" | "inactive";
	roleIds: string[];
	roleNames: string[];
}

interface InvitationRow {
	id: string;
	email: string;
	expiresAt: string;
	createdAt: string;
}

function MemberRoleForm({
	member,
	roles,
}: {
	member: MemberRow;
	roles: RoleOption[];
}) {
	const { data, setData, post, processing } = useForm({
		roleIds: member.roleIds,
	});
	const toggle = (roleId: string) => {
		setData(
			"roleIds",
			data.roleIds.includes(roleId)
				? data.roleIds.filter((id) => id !== roleId)
				: [...data.roleIds, roleId],
		);
	};
	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				post(`/admin/users/${member.membershipId}/roles`);
			}}
			className="grid gap-2"
		>
			<div className="flex flex-wrap gap-2">
				{roles.map((role) => (
					<label key={role.id} className="inline-flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border border-border cursor-pointer">
						<input
							type="checkbox"
							checked={data.roleIds.includes(role.id)}
							onChange={() => toggle(role.id)}
						/>
						{role.name}
					</label>
				))}
			</div>
			<button
				type="submit"
				disabled={processing}
				className="justify-self-start px-3 py-1.5 rounded-lg border border-primary bg-primary text-white text-xs font-semibold disabled:opacity-60"
			>
				{processing ? "Menyimpan…" : "Simpan role"}
			</button>
		</form>
	);
}

export default function AdminUsers({
	members,
	roles,
	invitations,
}: {
	members: MemberRow[];
	roles: RoleOption[];
	invitations: InvitationRow[];
}) {
	const { data, setData, post, processing, errors, reset } = useForm({
		email: "",
	});
	const invite = (event: FormEvent) => {
		event.preventDefault();
		post("/admin/users/invite", { onSuccess: () => reset() });
	};

	return (
		<Layout>
			<Head title="Anggota" />
			<div className="flex items-start justify-between gap-4 mb-6 max-md:flex-col">
				<div>
					<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Anggota</h1>
					<p className="text-muted m-0">
						Undang anggota lalu atur role mereka pada organisasi aktif.
					</p>
				</div>
			</div>

			<section className="bg-surface border border-border rounded-radius p-5 mb-5">
				<h2 className="text-lg mt-0 mb-3">Undang anggota</h2>
				<form onSubmit={invite} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-end max-md:grid-cols-1">
					<Field id="invite-email" label="Email" error={errors.email}>
						<input
							id="invite-email"
							type="email"
							className={inputClass}
							value={data.email}
							onChange={(event) => setData("email", event.target.value)}
						/>
					</Field>
					<button
						type="submit"
						disabled={processing}
						className="px-4 py-2.5 mb-4 rounded-lg border border-primary bg-primary text-white font-semibold disabled:opacity-60"
					>
						{processing ? "Mengirim…" : "Kirim undangan"}
					</button>
				</form>
			</section>

			<section className="bg-surface border border-border rounded-radius p-5 mb-5 overflow-x-auto">
				<h2 className="text-lg mt-0 mb-3">Anggota organisasi</h2>
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr>
							<th className="text-left p-2 border-b border-border">Anggota</th>
							<th className="text-left p-2 border-b border-border">Status</th>
							<th className="text-left p-2 border-b border-border min-w-[340px]">Role</th>
						</tr>
					</thead>
					<tbody>
						{members.map((member) => (
							<tr key={member.membershipId}>
								<td className="p-2 border-b border-border align-top">
									<div className="font-semibold">{member.name}</div>
									<div className="text-xs text-muted">{member.email}</div>
								</td>
								<td className="p-2 border-b border-border align-top capitalize">
									{member.userStatus} / {member.membershipStatus}
								</td>
								<td className="p-2 border-b border-border align-top">
									<MemberRoleForm member={member} roles={roles} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			<section className="bg-surface border border-border rounded-radius p-5">
				<h2 className="text-lg mt-0 mb-3">Undangan aktif</h2>
				<div className="grid gap-2">
					{invitations.map((invitation) => (
						<div key={invitation.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg">
							<div>
								<div className="font-medium">{invitation.email}</div>
								<div className="text-xs text-muted">
									Berlaku sampai {new Date(invitation.expiresAt).toLocaleString("id-ID")}
								</div>
							</div>
							<button
								type="button"
								className="px-3 py-1.5 rounded-lg border border-border bg-transparent text-sm cursor-pointer"
								onClick={() => router.post(`/admin/users/invitations/${invitation.id}/revoke`)}
							>
								Cabut
							</button>
						</div>
					))}
					{invitations.length === 0 ? <p className="text-sm text-muted m-0">Tidak ada undangan aktif.</p> : null}
				</div>
			</section>
		</Layout>
	);
}
