export const RECRUITMENT_REPOSITORY = Symbol('RECRUITMENT_REPOSITORY');

export type CreateRecruitmentInput = {
  teamId: string;
  title: string;
  slug: string;
  summary?: string | null;
  description?: string | null;
  urgent: boolean;
  isPaid: boolean;
  missions?: string[] | null;
  target: string;
  gameId?: number | null;
  platformIds?: number[];
  positionIds?: number[];
  rankIds?: number[];
  minElo?: number | null;
  maxElo?: number | null;
  minRankId?: number | null;
  maxRankId?: number | null;
  isPublished: boolean;
  questions?: Array<{
    prompt: string;
    type: string;
    isRequired: boolean;
    order: number;
  }>;
};

export type UpdateRecruitmentInput = Partial<Omit<CreateRecruitmentInput, 'teamId' | 'slug'>>;

export type RecruitmentApplicationAnswerInput = {
  questionId: string;
  answerText?: string | null;
  answerBoolean?: boolean | null;
};

export type CreateRecruitmentApplicationInput = {
  recruitmentId: string;
  candidateId: string;
  motivation?: string | null;
  positionId?: number | null;
  answers?: RecruitmentApplicationAnswerInput[];
};

export interface RecruitmentRepositoryPort {
  search(query: any): Promise<{ items: any[]; total: number }>;
  findById(id: string): Promise<any | null>;
  existsSlug(teamId: string, slug: string): Promise<boolean>;
  create(input: CreateRecruitmentInput): Promise<any>;
  update(id: string, input: UpdateRecruitmentInput): Promise<any>;
  delete(id: string): Promise<void>;

  findApplicationById(id: string): Promise<any | null>;
  findApplicationByRecruitmentAndCandidate(recruitmentId: string, candidateId: string): Promise<any | null>;
  findCandidateProfileById(candidateId: string): Promise<any | null>;
  findRecruitmentManagerProfileIds(teamId: string, excludedProfileIds?: string[]): Promise<string[]>;
  findPlayerGameForCandidate(candidateId: string, gameId: number): Promise<any | null>;
  findPlayerGamesForCandidates(candidateIds: string[], gameId: number): Promise<Map<string, any>>;
  createApplication(input: CreateRecruitmentApplicationInput): Promise<any>;
  saveApplication(application: any): Promise<any>;
  listApplications(recruitmentId: string): Promise<any[]>;
  listCandidateApplications(candidateId: string): Promise<any[]>;
  countApplicationsByRecruitmentIds(recruitmentIds: string[]): Promise<Map<string, number>>;
  findAppliedRecruitmentIds(recruitmentIds: string[], candidateId: string): Promise<Set<string>>;
}
