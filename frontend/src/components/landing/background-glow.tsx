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

      {/* Slow-drifting aurora orbs — depth without distracting the hero copy */}
      <div
        aria-hidden
        className="landing-aurora-glow pointer-events-none absolute -left-[20%] top-32 h-[min(90vw,520px)] w-[min(90vw,520px)] rounded-full [background:radial-gradient(circle_at_30%_30%,rgba(45,88,67,0.18),transparent_65%)] blur-3xl dark:[background:radial-gradient(circle_at_30%_30%,rgba(45,88,67,0.35),transparent_65%)]"
        style={{
          animation: "landing-aurora-drift-a 22s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="landing-aurora-glow pointer-events-none absolute -right-[15%] top-10 h-[min(70vw,440px)] w-[min(70vw,440px)] rounded-full [background:radial-gradient(circle_at_70%_40%,rgba(212,80,43,0.08),transparent_68%)] blur-3xl dark:[background:radial-gradient(circle_at_70%_40%,rgba(212,80,43,0.18),transparent_68%)]"
        style={{
          animation: "landing-aurora-drift-b 26s ease-in-out infinite reverse",
        }}
      />
      <div
        aria-hidden
        className="landing-aurora-glow pointer-events-none absolute left-1/2 top-[280px] h-[280px] w-[min(100%,640px)] -translate-x-1/2 rounded-full [background:radial-gradient(ellipse_at_center,rgba(45,88,67,0.06),transparent_72%)] blur-2xl dark:[background:radial-gradient(ellipse_at_center,rgba(45,88,67,0.2),transparent_72%)]"
        style={{
          animation: "landing-aurora-drift-a 30s ease-in-out infinite",
        }}
      />
    </>
  );
}
