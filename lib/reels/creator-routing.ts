export function getCreatorSlug(creatorName: string) {
  return creatorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creator";
}

export function getCreatorHref(creatorProfileId: string) {
  return `/creators/${encodeURIComponent(creatorProfileId)}`;
}
