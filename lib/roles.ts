export const USER_ROLES = {
  admin: "admin",
  creator: "creator",
  user: "user",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export function isAdminRole(role: string | null | undefined): role is typeof USER_ROLES.admin {
  return role === USER_ROLES.admin;
}
