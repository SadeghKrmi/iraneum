/** Layout for the plain text pages in the menu (About, References, ...): a readable panel over the map. */
export function ProsePage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="fixed inset-x-0 bottom-[var(--dock-h)] top-20 z-10 overflow-y-auto px-4">
      <article className="mx-auto my-4 flex max-w-2xl flex-col gap-4 rounded-3xl border border-line bg-surface/90 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <h1 className="text-3xl font-bold leading-snug text-gold">{title}</h1>
        <div className="flex flex-col gap-4 text-lg leading-loose">{children}</div>
      </article>
    </main>
  );
}
