export const TEAM_RECRUITMENT_TARGETS = ['MEMBER', 'STAFF'] as const;
export type TeamRecruitmentTarget = (typeof TEAM_RECRUITMENT_TARGETS)[number];

export const TEAM_RECRUITMENT_QUESTION_TYPES = ['SHORT_TEXT', 'LONG_TEXT', 'YES_NO', 'TEXT'] as const;
export type TeamRecruitmentQuestionType = (typeof TEAM_RECRUITMENT_QUESTION_TYPES)[number];

export const TEAM_RECRUITMENT_APPLICATION_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'GOOD_FIT',
  'INTERVIEW_SCHEDULED',
] as const;
export type TeamRecruitmentApplicationStatus = (typeof TEAM_RECRUITMENT_APPLICATION_STATUSES)[number];

export type RecruitmentPresenter = {
  id: string;
  teamId: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  urgent: boolean;
  isPaid: boolean;
  missions: string[];
  target: TeamRecruitmentTarget;
  gameId: number | null;
  platformIds: number[];
  positionIds: number[];
  rankIds: number[];
  minElo: number | null;
  maxElo: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecruitmentApplicationPresenter = {
  id: string;
  recruitmentId: string;
  candidateId: string;
  status: TeamRecruitmentApplicationStatus;
  motivation: string | null;
  positionId: number | null;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
};
