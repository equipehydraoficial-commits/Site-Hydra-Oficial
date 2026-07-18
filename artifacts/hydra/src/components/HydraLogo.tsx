export function HydraLogo({ className }: { className?: string }) {
  return (
    <img
      src="/hydra-logo.png"
      alt="Hydra Logo"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
