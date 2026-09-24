import { Head } from "@inertiajs/react";
import { useState } from "react";
import Layout from "../components/Layout";

interface Run {
	id: string;
	templateName: string;
	roleName: string | null;
	status: "in_progress" | "completed";
	progressPercent: number;
	completedAt: string | null;
}

interface RunItem {
	id: string;
	title: string;
	description: string | null;
	position: number;
	completed: number;
	completedAt: string | null;
}

export default function ChecklistRun({
	run: initialRun,
	items: initialItems,
}: {
	run: Run;
	items: RunItem[];
}) {
	const [run, setRun] = useState(initialRun);
	const [items, setItems] = useState(initialItems);
	const [savingId, setSavingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const toggle = async (item: RunItem) => {
		const completed = item.completed !== 1;
		setSavingId(item.id);
		setError(null);
		try {
			const response = await fetch(
				`/checklists/runs/${run.id}/items/${item.id}`,
				{
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ completed }),
				},
			);
			if (!response.ok) throw new Error("save_failed");
			const payload = (await response.json()) as {
				run: Pick<Run, "id" | "status" | "progressPercent" | "completedAt"> | null;
			};
			setItems((current) =>
				current.map((currentItem) =>
					currentItem.id === item.id
						? { ...currentItem, completed: completed ? 1 : 0 }
						: currentItem,
				),
			);
			if (payload.run)
				setRun((current) => ({ ...current, ...payload.run }));
		} catch {
			setError("Perubahan belum tersimpan. Coba lagi.");
		} finally {
			setSavingId(null);
		}
	};

	return (
		<Layout>
			<Head title={run.templateName} />
			<div className="flex items-start justify-between gap-4 mb-5 max-md:flex-col">
				<div>
					<h1 className="text-[1.6rem] m-0 mb-1 tracking-tight">{run.templateName}</h1>
					<p className="text-muted m-0">{run.roleName ? `Role: ${run.roleName}` : "Checklist aktif"}</p>
				</div>
				<div className="min-w-[200px]">
					<div className="flex items-center justify-between text-sm mb-1">
						<span>{run.status === "completed" ? "Selesai" : "Sedang dikerjakan"}</span>
						<strong>{run.progressPercent}%</strong>
					</div>
					<div
						className="h-2 rounded-full bg-border overflow-hidden"
						role="progressbar"
						aria-label="Progres checklist"
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={run.progressPercent}
					>
						<div className="h-full bg-primary transition-[width]" style={{ width: `${run.progressPercent}%` }} />
					</div>
				</div>
			</div>

			{error ? (
				<div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
					{error}
				</div>
			) : null}

			<div className="grid gap-3">
				{items.map((item) => (
					<label
						key={item.id}
						className="flex items-start gap-3 bg-surface border border-border rounded-radius p-4 cursor-pointer"
					>
						<input
							type="checkbox"
							className="mt-1 w-5 h-5"
							checked={item.completed === 1}
							disabled={savingId === item.id}
							onChange={() => toggle(item)}
						/>
						<div className="min-w-0 flex-1">
							<div className="flex items-center justify-between gap-3">
								<strong className={item.completed === 1 ? "line-through text-muted" : ""}>
									{item.position}. {item.title}
								</strong>
								{savingId === item.id ? <span className="text-xs text-muted">Menyimpan…</span> : null}
							</div>
							{item.description ? <p className="text-sm text-muted mt-1 mb-0">{item.description}</p> : null}
						</div>
					</label>
				))}
			</div>
		</Layout>
	);
}
