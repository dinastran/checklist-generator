import { Head, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import Layout from "../components/Layout";
import type { OrganizationContext } from "../../shared/types";

export default function OrganizationSwitch({
	organizations,
}: {
	organizations: OrganizationContext[];
}) {
	const { data, setData, post, processing, errors } = useForm({
		organizationId: organizations[0]?.id ?? "",
	});

	const submit = (event: FormEvent) => {
		event.preventDefault();
		post("/organizations/switch");
	};

	return (
		<Layout>
			<Head title="Pilih Organisasi" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">Pilih organisasi</h1>
			<p className="text-muted mb-5">
				Pilih konteks kerja sebelum membuka dashboard dan data operasional.
			</p>

			<form onSubmit={submit} className="max-w-xl">
				<label htmlFor="organizationId" className="block text-sm font-semibold mb-1.5">
					Organisasi
				</label>
				<select
					id="organizationId"
					name="organizationId"
					className="w-full px-3 py-2.5 border border-border rounded-lg bg-surface text-text"
					value={data.organizationId}
					onChange={(event) => setData("organizationId", event.target.value)}
				>
					{organizations.map((organization) => (
						<option key={organization.id} value={organization.id}>
							{organization.name}
						</option>
					))}
				</select>
				{errors.organizationId ? (
					<p className="text-sm text-danger mt-1">{errors.organizationId}</p>
				) : null}

				<button
					className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 mt-4 border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer disabled:opacity-60"
					type="submit"
					disabled={processing || !data.organizationId}
				>
					{processing ? "Membuka…" : "Buka organisasi"}
				</button>
			</form>
		</Layout>
	);
}
