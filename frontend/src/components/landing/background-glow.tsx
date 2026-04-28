export function BackgroundGlow() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] [background:radial-gradient(60%_60%_at_50%_0%,rgba(45,88,67,0.05),transparent_70%)] dark:[background:radial-gradient(60%_60%_at_50%_0%,rgba(45,88,67,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[600px] h-[420px] [background:radial-gradient(50%_50%_at_50%_50%,rgba(212,80,43,0.03),transparent_70%)] dark:[background:radial-gradient(50%_50%_at_50%_50%,rgba(212,80,43,0.06),transparent_70%)]"
      />
    </>
  );
}
