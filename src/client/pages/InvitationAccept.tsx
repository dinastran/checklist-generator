import { Head, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";

export default function InvitationAccept({
	token,
	organizationName,
	invitedEmail,
	canAccept,
	message,
}: {
	token: string;
	organizationName: string | null;
	invitedEmail: string | null;
	canAccept: boolean;
	message: string | null;
}) {
	const { post, processing, errors } = useForm({ token });
	const submit = (event: FormEvent) => {
		event.preventDefault();
		post("/invitations/accept");
	};

	return (
		<Layout>
			<Head title="Undangan Organisasi" />
			<div className="max-w-xl mx-auto bg-surface border border-border rounded-radius p-6">
				<h1 className="text-[1.5rem] mt-0 mb-2">Undangan organisasi</h1>
				{organizationName ? (
					<p className="text-muted">
						Kamu diundang bergabung ke <strong>{organizationName}</strong>
						{invitedEmail ? ` sebagai ${invitedEmail}` : ""}.
					</p>
				) : null}
				{message ? <p className="text-sm text-danger">{message}</p> : null}
				{errors.token ? <p className="text-sm text-danger">{errors.token}</p> : null}
				{canAccept ? (
					<form onSubmit={submit}>
						<button
							type="submit"
							disabled={processing}
							className="px-4 py-2.5 rounded-lg border border-primary bg-primary text-white font-semibold disabled:opacity-60"
						>
							{processing ? "Memproses…" : "Terima undangan"}
						</button>
					</form>
				) : null}
			</div>
		</Layout>
	);
}
