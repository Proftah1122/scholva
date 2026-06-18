const highlights = [
  "Student topic suggestions",
  "Industry problem matching",
  "Project discovery"
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-center justify-between border-b border-stone-300 pb-4">
          <span className="text-lg font-semibold tracking-normal">Scholva</span>
          <span className="text-sm text-stone-600">Phase 1 Foundation</span>
        </header>
        <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-normal text-stone-950 md:text-5xl">
              Research intelligence linking Nigerian scholars with industry problems.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-700">
              The foundation is ready for the Identity, Scholar, Suggestion, Matching,
              Industry, and Engagement contexts.
            </p>
          </div>
          <div className="border border-stone-300 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-normal text-stone-500">
              MVP pillars
            </h2>
            <ul className="mt-4 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="border-l-2 border-emerald-600 pl-3 text-sm text-stone-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
