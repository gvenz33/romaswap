export const theme = {
  ink: "#090909",
  panel: "#14120e",
  line: "#3a3326",
  gold: "#c6a15b",
  goldBright: "#f0e2c0",
  cream: "#f6f1e7",
  mute: "#a89b88",
  danger: "#e07a5f",
  ok: "#8fbf9f",
} as const;

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
