// PROTOTYPE — Variant A "Linear Dense": dark, sidebar + right properties rail, compact rows.
import {
  type MockTask,
  milestones,
  notes,
  outstanding,
  paidTotal,
  project,
  secrets,
  tasks,
} from "./mock-data";

const priorityColor: Record<MockTask["priority"], string> = {
  Urgent: "bg-red-500",
  High: "bg-orange-400",
  Medium: "bg-yellow-400",
  Low: "bg-sky-400",
  None: "bg-zinc-600",
};

export function VariantALinear() {
  const groups = ["InProgress", "Todo", "Done"] as const;

  return (
    <div className="flex min-h-screen bg-zinc-950 font-sans text-[13px] text-zinc-300">
      <aside className="flex w-52 flex-col border-r border-zinc-800/80 px-3 py-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex size-5 items-center justify-center rounded bg-violet-500 text-[10px] font-bold text-white">
            C
          </div>
          <span className="font-semibold text-zinc-100">Corvex</span>
        </div>
        <nav className="grid gap-0.5">
          {["Projects", "Customers", "Settings"].map((item, i) => (
            <span
              key={item}
              className={`rounded px-2 py-1 ${i === 0 ? "bg-zinc-800/80 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              {item}
            </span>
          ))}
        </nav>
        <div className="mt-6 border-t border-zinc-800/80 pt-4">
          <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
            Nimbus CRM
          </p>
          {["Tasks", "Milestones", "Payments", "Notes", "Secrets", "MCP"].map((item, i) => (
            <span
              key={item}
              className={`block rounded px-2 py-1 ${i === 0 ? "text-violet-400" : "text-zinc-500"}`}
            >
              {item}
            </span>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex h-12 items-center gap-3 border-b border-zinc-800/80 px-5">
          <span className="text-zinc-500">Projects</span>
          <span className="text-zinc-700">/</span>
          <span className="font-medium text-zinc-100">{project.name}</span>
          <span className="ml-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-300">
            {project.status}
          </span>
          <span className="ml-auto text-zinc-500">Due {project.deadline}</span>
        </header>

        <div className="px-5 py-4">
          {groups.map((status) => {
            const list = tasks.filter((t) => t.status === status);
            return (
              <section key={status} className="mb-5">
                <h3 className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  {status === "InProgress" ? "In Progress" : status}
                  <span className="text-zinc-700">{list.length}</span>
                </h3>
                <ul className="divide-y divide-zinc-800/60 border-y border-zinc-800/60">
                  {list.map((t) => (
                    <li
                      key={t.id}
                      className="group flex h-8 items-center gap-2.5 px-1 hover:bg-zinc-900"
                    >
                      <span className={`size-2 rounded-full ${priorityColor[t.priority]}`} />
                      <span
                        className={
                          t.status === "Done" ? "text-zinc-600 line-through" : "text-zinc-200"
                        }
                      >
                        {t.title}
                      </span>
                      {t.dueDate ? (
                        <span className="ml-auto text-[11px] text-zinc-600">{t.dueDate}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <section className="mb-5">
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Notes
            </h3>
            {notes.map((n) => (
              <div
                key={n.id}
                className="mb-1 rounded border border-zinc-800/60 bg-zinc-900/50 px-3 py-2"
              >
                <p className="font-medium text-zinc-200">{n.title}</p>
                <p className="mt-0.5 text-zinc-500">{n.body}</p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <aside className="w-64 border-l border-zinc-800/80 px-4 py-4 text-[12px]">
        <dl className="grid gap-3">
          <div>
            <dt className="text-zinc-600">Customer</dt>
            <dd className="mt-0.5 text-zinc-200">{project.customer.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-600">Budget</dt>
            <dd className="mt-0.5 text-zinc-200">
              ${project.budgetAmount} <span className="text-zinc-500">USD</span>
            </dd>
          </div>
          <div className="flex gap-4">
            <div>
              <dt className="text-zinc-600">Paid</dt>
              <dd className="mt-0.5 text-emerald-400">${paidTotal}</dd>
            </div>
            <div>
              <dt className="text-zinc-600">Outstanding</dt>
              <dd className="mt-0.5 text-amber-400">${outstanding}</dd>
            </div>
          </div>
        </dl>

        <h4 className="mt-5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Milestones
        </h4>
        <ul className="grid gap-1.5">
          {milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <span
                className={`flex size-3.5 items-center justify-center rounded-full border text-[9px] ${
                  m.done ? "border-violet-500 bg-violet-500 text-white" : "border-zinc-700"
                }`}
              >
                {m.done ? "✓" : ""}
              </span>
              <span className={m.done ? "text-zinc-500" : "text-zinc-300"}>{m.name}</span>
              <span className="ml-auto text-zinc-600">{m.date.slice(5)}</span>
            </li>
          ))}
        </ul>

        <h4 className="mt-5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
          Secrets
        </h4>
        <ul className="grid gap-1">
          {secrets.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-zinc-300">
                {s.name}
              </code>
              <span className="ml-auto font-mono text-zinc-700">••••</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
