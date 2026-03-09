export const TEAM_MEMBER_PERMISSIONS = {
  MANAGE_TEAM: 1 << 0,
  MANAGE_MEMBERS: 1 << 1,
  MANAGE_ROSTERS: 1 << 2,
  MANAGE_RECRUITMENT: 1 << 3,
  MANAGE_SPONSORS: 1 << 4,
  MANAGE_PERMISSIONS: 1 << 5,
  MANAGE_INSIGHTS: 1 << 6,
  DELETE_ROSTERS: 1 << 7,
  MANAGE_FOLLOW: 1 << 8,
  MANAGE_POSTS: 1 << 9,
} as const;

export type TeamMemberPermission = (typeof TEAM_MEMBER_PERMISSIONS)[keyof typeof TEAM_MEMBER_PERMISSIONS];

export const TEAM_MEMBER_PERMISSIONS_ALL = (Object.values(TEAM_MEMBER_PERMISSIONS) as number[]).reduce(
  (acc, perm) => acc | perm,
  0,
);
