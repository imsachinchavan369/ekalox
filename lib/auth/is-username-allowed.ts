import {
  PROTECTED_AUTHORITY_IDENTITIES,
  PROTECTED_AUTHORITY_MODIFIERS,
  PROTECTED_BRAND_IDENTITIES,
  PROTECTED_TRUST_IDENTITIES,
} from "@/lib/constants/reserved-usernames";

import {
  collapseRepeatedCharactersForSecurityCheck,
  normalizeUsernameForSecurityCheck,
  tokenizeUsernameForSecurityCheck,
} from "@/lib/auth/normalize-username-for-security-check";
import { isSuspiciouslySimilarToProtectedName } from "@/lib/auth/is-suspiciously-similar-to-protected-name";

const protectedAuthoritySet = new Set<string>([...PROTECTED_AUTHORITY_IDENTITIES, ...PROTECTED_TRUST_IDENTITIES]);
const protectedExactSet = new Set<string>([
  ...PROTECTED_BRAND_IDENTITIES,
  ...PROTECTED_AUTHORITY_IDENTITIES,
  ...PROTECTED_TRUST_IDENTITIES,
]);

function hasProtectedAuthorityCompound(normalized: string) {
  const protectedWords = [...PROTECTED_AUTHORITY_IDENTITIES, ...PROTECTED_TRUST_IDENTITIES];

  for (const first of protectedWords) {
    for (const second of protectedWords) {
      if (first === second) {
        continue;
      }

      if (normalized.includes(`${first}${second}`) || normalized.includes(`${second}${first}`)) {
        return true;
      }
    }
  }

  return false;
}

function hasAuthorityImpersonation(rawUsername: string) {
  const normalized = normalizeUsernameForSecurityCheck(rawUsername);
  const collapsed = collapseRepeatedCharactersForSecurityCheck(normalized);
  const tokens = tokenizeUsernameForSecurityCheck(rawUsername);

  if (tokens.some((token) => protectedAuthoritySet.has(token)) && tokens.length > 1) {
    return true;
  }

  if (hasProtectedAuthorityCompound(normalized) || hasProtectedAuthorityCompound(collapsed)) {
    return true;
  }

  for (const protectedWord of protectedAuthoritySet) {
    if (normalized === protectedWord || collapsed === protectedWord) {
      return true;
    }

    for (const modifier of PROTECTED_AUTHORITY_MODIFIERS) {
      if (
        normalized === `${modifier}${protectedWord}` ||
        normalized === `${protectedWord}${modifier}` ||
        collapsed === `${modifier}${protectedWord}` ||
        collapsed === `${protectedWord}${modifier}`
      ) {
        return true;
      }
    }
  }

  return false;
}

export function getUsernameValidationError(username: string) {
  const normalized = normalizeUsernameForSecurityCheck(username);

  if (!normalized || normalized.length < 3) {
    return "This username is not allowed. Please choose a different username.";
  }

  if (protectedExactSet.has(normalized)) {
    return "This username is reserved or too similar to a protected EKALOX identity. Please choose another username.";
  }

  for (const brandName of PROTECTED_BRAND_IDENTITIES) {
    if (isSuspiciouslySimilarToProtectedName(username, brandName)) {
      return "This username is reserved or too similar to a protected EKALOX identity. Please choose another username.";
    }
  }

  if (hasAuthorityImpersonation(username)) {
    return "This username is not allowed. Please choose a different username.";
  }

  return null;
}

export function isUsernameAllowed(username: string) {
  return getUsernameValidationError(username) === null;
}
