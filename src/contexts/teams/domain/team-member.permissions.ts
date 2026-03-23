import { permissionBit } from "@/core/security/permissions";

export const TEAM_MEMBER_PERMISSIONS = {
  MANAGE_TEAM: permissionBit(0),
  MANAGE_MEMBERS: permissionBit(1),
  MANAGE_ROSTERS: permissionBit(2),
  MANAGE_RECRUITMENT: permissionBit(3),
  MANAGE_SPONSORS: permissionBit(4),
  MANAGE_PERMISSIONS: permissionBit(5),
  MANAGE_INSIGHTS: permissionBit(6),
  DELETE_ROSTERS: permissionBit(7),
  MANAGE_FOLLOW: permissionBit(8),
  MANAGE_POSTS: permissionBit(9),
  MANAGE_CALENDAR: permissionBit(10),
} as const;

export type TeamMemberPermission = (typeof TEAM_MEMBER_PERMISSIONS)[keyof typeof TEAM_MEMBER_PERMISSIONS];

export const TEAM_MEMBER_PERMISSIONS_ALL = (Object.values(TEAM_MEMBER_PERMISSIONS) as bigint[]).reduce(
  (acc, perm) => acc | perm,
  0n,
);
