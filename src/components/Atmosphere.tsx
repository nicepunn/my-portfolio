/** Shared hero/footer backdrop: gradient washes + grain + soft orb. */
export function Atmosphere({ orb = "left" }: { orb?: "left" | "right" }) {
  const orbClass =
    orb === "left"
      ? "absolute -left-1/4 top-1/3 h-[50vmax] w-[50vmax] rounded-full blur-2xl"
      : "absolute -right-1/4 bottom-0 h-[45vmax] w-[45vmax] rounded-full blur-2xl";

  return (
    <div aria-hidden className="atmosphere">
      <div className="hero-backdrop absolute inset-0" />
      <div className="grain absolute inset-0" />
      <div className={`hero-orb ${orbClass}`} />
    </div>
  );
}
