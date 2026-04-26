import { collapseRepeatedCharactersForSecurityCheck, normalizeUsernameForSecurityCheck } from "@/lib/auth/normalize-username-for-security-check";

function buildSecurityForms(username: string) {
  const normalized = normalizeUsernameForSecurityCheck(username);
  const collapsed = collapseRepeatedCharactersForSecurityCheck(normalized);

  return {
    collapsed,
    normalized,
  };
}

export function isSuspiciouslySimilarToProtectedName(username: string, protectedName: string) {
  const { collapsed, normalized } = buildSecurityForms(username);
  const protectedNormalized = normalizeUsernameForSecurityCheck(protectedName);
  const protectedCollapsed = collapseRepeatedCharactersForSecurityCheck(protectedNormalized);

  if (!normalized || !protectedNormalized) {
    return false;
  }

  return (
    normalized === protectedNormalized ||
    collapsed === protectedCollapsed ||
    normalized.includes(protectedNormalized) ||
    collapsed.includes(protectedCollapsed) ||
    normalized.startsWith(protectedNormalized) ||
    collapsed.startsWith(protectedCollapsed) ||
    normalized.endsWith(protectedNormalized) ||
    collapsed.endsWith(protectedCollapsed)
  );
}
