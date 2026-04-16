export const RECRUITMENT_APPLICATION_CREATED_EVENT = 'recruitment.application.created';

export type RecruitmentApplicationCreatedPayload = {
  applicationId: string;
  recruitmentId: string;
  recruitmentSlug: string;
  recruitmentTitle: string;
  teamId: string;
  teamSlug: string;
  teamName: string;
  candidateId: string;
  candidateSlug: string;
  candidateUsername: string;
  recipientProfileIds: string[];
};
