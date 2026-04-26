import { getUsernameValidationError } from "@/lib/auth/is-username-allowed";

export function sanitizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

export function validateUsernameOrThrow(username: string) {
  const error = getUsernameValidationError(username);

  if (error) {
    throw new Error(error);
  }

  return username;
}

export function createSafeGeneratedUsername(seed: string, userId: string) {
  const base = sanitizeUsername(seed).slice(0, 18) || "creator";
  const suffix = userId.slice(0, 8).toLowerCase();

  const directCandidate = `${base}_${suffix}`.slice(0, 24);
  if (!getUsernameValidationError(directCandidate)) {
    return directCandidate;
  }

  return `creator_${suffix}`.slice(0, 24);
}
