export type SkillEmphasis = "primary" | "secondary" | "muted";

export type ParsedSkill = {
  label: string;
  emphasis: SkillEmphasis;
  raw: string;
};

const PRIMARY_RE = /^\[\*{3}(.+?)\*{3}\]$/;
const SECONDARY_RE = /^\[\*(.+?)\*\]$/;

export function parseSkillItem(raw: string): ParsedSkill {
  const trimmed = raw.trim();

  const primary = trimmed.match(PRIMARY_RE);
  if (primary) {
    return { label: primary[1].trim(), emphasis: "primary", raw: trimmed };
  }

  const secondary = trimmed.match(SECONDARY_RE);
  if (secondary) {
    return { label: secondary[1].trim(), emphasis: "secondary", raw: trimmed };
  }

  return { label: trimmed, emphasis: "muted", raw: trimmed };
}

export function skillDisplayLabel(raw: string) {
  return parseSkillItem(raw).label;
}

const emphasisRank: Record<SkillEmphasis, number> = {
  primary: 0,
  secondary: 1,
  muted: 2,
};

export function sortSkillsByEmphasis(items: string[]) {
  return [...items].sort((a, b) => {
    const left = parseSkillItem(a);
    const right = parseSkillItem(b);
    const rankDiff =
      emphasisRank[left.emphasis] - emphasisRank[right.emphasis];
    if (rankDiff !== 0) return rankDiff;
    return left.label.localeCompare(right.label);
  });
}

export const skillEmphasisClass: Record<SkillEmphasis, string> = {
  primary:
    "font-semibold text-[var(--fg)] underline decoration-[var(--accent)] decoration-2 underline-offset-4",
  secondary: "font-medium text-[var(--fg)]/85",
  muted: "font-normal text-[var(--muted)]/55",
};
