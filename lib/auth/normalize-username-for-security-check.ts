const LOOKALIKE_MAP: Record<string, string> = {
  "@": "a",
  "$": "s",
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
};

export function normalizeUsernameForSecurityCheck(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[\s_.-]+/g, "")
    .replace(/[^a-z0-9@$]/g, "")
    .split("")
    .map((character) => LOOKALIKE_MAP[character] ?? character)
    .join("");
}

export function collapseRepeatedCharactersForSecurityCheck(username: string) {
  return username.replace(/(.)\1+/g, "$1");
}

export function tokenizeUsernameForSecurityCheck(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);
}
