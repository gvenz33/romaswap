const SRC = {
  wave: "/mascot/centurion-wave.png",
  thumbs: "/mascot/centurion-thumbs.png",
  shock: "/mascot/centurion-shock.png",
  cheer: "/mascot/centurion-cheer.png",
  chariot: "/mascot/centurion-chariot.jpg",
} as const;

export function Mascot({
  pose,
  alt,
  className = "",
}: {
  pose: keyof typeof SRC;
  alt: string;
  className?: string;
}) {
  return <img src={SRC[pose]} alt={alt} className={`select-none ${className}`} />;
}
