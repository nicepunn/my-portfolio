type SectionHeadingProps = {
  eyebrow: string;
  title: string;
};

export function SectionHeading({ eyebrow, title }: SectionHeadingProps) {
  return (
    <div className="mb-8 max-w-2xl sm:mb-10">
      <p className="label-caps mb-2.5 sm:mb-3">{eyebrow}</p>
      <h2 className="font-display text-[1.85rem] leading-[1.1] font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
