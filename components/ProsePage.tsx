/** Layout for the plain text pages in the menu (About, References, ...). */
export function ProsePage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="flex w-full max-w-2xl flex-col gap-4 self-start">
      <h1 className="text-3xl font-bold leading-snug text-gold">{title}</h1>
      <div className="flex flex-col gap-4 text-lg leading-loose">{children}</div>
    </article>
  );
}
