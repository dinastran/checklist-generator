import { Head, useForm } from "@inertiajs/react";
import type { FormEvent } from "react";
import AuthLayout from "../components/AuthLayout";
import Field, { inputClass } from "../components/Field";

export default function OrganizationNew() {
	const { data, setData, post, processing, errors, clearErrors } = useForm({
		name: "",
	});

	const submit = (event: FormEvent) => {
		event.preventDefault();
		post("/organizations/new");
	};

	return (
		<AuthLayout>
			<Head title="Buat Organisasi" />
			<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">
				Buat organisasi pertama
			</h1>
			<p className="text-muted mb-5">
				Checklist, role, anggota, dan riwayat akan terisolasi di organisasi ini.
			</p>

			<form onSubmit={submit} noValidate>
				<Field id="name" label="Nama organisasi" error={errors.name}>
					<input
						id="name"
						type="text"
						name="name"
						className={inputClass}
						value={data.name}
						onChange={(event) => {
							clearErrors("name");
							setData("name", event.target.value);
						}}
					/>
				</Field>

				<button
					className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 w-full border border-primary rounded-lg bg-primary text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-primary-hover hover:border-primary-hover hover:no-underline disabled:opacity-60 disabled:cursor-not-allowed"
					type="submit"
					disabled={processing}
				>
					{processing ? "Membuat organisasi…" : "Buat organisasi"}
				</button>
			</form>
		</AuthLayout>
	);
}
