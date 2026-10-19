type SectionHeadingProps = {
  eyebrow: string;
  title: string;
};

export function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="label-caps mb-3">{eyebrow}</p>
      <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
