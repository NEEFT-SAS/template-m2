import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RECRUITMENT_REPOSITORY,
  RecruitmentApplicationAnswerInput,
  RecruitmentRepositoryPort,
} from '../ports/recruitment.repository.port';
import { ApplyToRecruitmentDto, RecruitmentAnswerPayloadDto } from '../../api/dtos/apply-to-recruitment.dto';
import {
  RecruitmentAlreadyAppliedError,
  RecruitmentCandidateNotFoundError,
  RecruitmentInvalidApplicationError,
  RecruitmentNotFoundError,
  RecruitmentNotPublishedError,
} from '../../domain/errors/recruitment.errors';
import { mapRecruitmentApplicationPresenter } from '../services/recruitment-application.presenter';
import {
  RECRUITMENT_APPLICATION_CREATED_EVENT,
  RecruitmentApplicationCreatedPayload,
} from '../../domain/events/recruitment-application-created.event';

@Injectable()
export class ApplyToRecruitmentUseCase {
  constructor(
    @Inject(RECRUITMENT_REPOSITORY)
    private readonly repo: RecruitmentRepositoryPort,
    private readonly events: EventEmitter2,
  ) { }

  async execute(recruitmentId: string, requesterProfileId: string, dto: ApplyToRecruitmentDto) {
    const recruitment = await this.repo.findById(recruitmentId);
    if (!recruitment) {
      throw new RecruitmentNotFoundError(recruitmentId);
    }

    if (!recruitment.isPublished) {
      throw new RecruitmentNotPublishedError();
    }

    const candidate = await this.repo.findCandidateProfileById(requesterProfileId);
    if (!candidate) {
      throw new RecruitmentCandidateNotFoundError(requesterProfileId);
    }

    const existing = await this.repo.findApplicationByRecruitmentAndCandidate(recruitment.id, candidate.id);
    if (existing) {
      throw new RecruitmentAlreadyAppliedError();
    }

    await this.validateCandidateEloEligibility(recruitment, candidate.id);

    const positionId = this.resolvePositionId(recruitment, dto.positionId ?? null);
    const answers = this.buildApplicationAnswers(recruitment, dto.answers ?? []);

    const application = await this.repo.createApplication({
      recruitmentId: recruitment.id,
      candidateId: candidate.id,
      positionId,
      motivation: this.nullableString(dto.motivation ?? null),
      answers,
    });

    await this.emitApplicationCreated(recruitment, application, candidate);

    return mapRecruitmentApplicationPresenter(application);
  }

  private async emitApplicationCreated(recruitment: any, application: any, candidate: any) {
    const teamId = String(recruitment.teamId ?? recruitment.team?.id ?? '').trim();
    if (!teamId) return;

    const recipientProfileIds = await this.repo.findRecruitmentManagerProfileIds(teamId, [candidate.id]);
    if (!recipientProfileIds.length) return;

    const payload: RecruitmentApplicationCreatedPayload = {
      applicationId: application.id,
      recruitmentId: recruitment.id,
      recruitmentSlug: recruitment.slug,
      recruitmentTitle: recruitment.title,
      teamId,
      teamSlug: recruitment.team?.slug ?? '',
      teamName: recruitment.team?.name ?? '',
      candidateId: candidate.id,
      candidateSlug: candidate.slug,
      candidateUsername: candidate.username,
      recipientProfileIds,
    };

    await this.events.emitAsync(RECRUITMENT_APPLICATION_CREATED_EVENT, payload);
  }

  private resolvePositionId(recruitment: any, requestedPositionId: number | null): number | null {
    if (recruitment.target !== 'MEMBER') {
      return null;
    }

    const positions = recruitment.positions ?? [];
    const selected = positions.find((position: any) => {
      return position.id === requestedPositionId || position.position?.id === requestedPositionId;
    });

    if (!selected) {
      throw new RecruitmentInvalidApplicationError(
        "Le poste selectionne n'est pas valide pour cette offre de recrutement.",
        { positionId: ['invalid'] },
        { recruitmentId: recruitment.id, positionId: requestedPositionId },
      );
    }

    return selected.id;
  }

  private buildApplicationAnswers(
    recruitment: any,
    answers: RecruitmentAnswerPayloadDto[],
  ): RecruitmentApplicationAnswerInput[] {
    const questions = recruitment.questions ?? [];
    const hasRequiredQuestion = questions.some((question: any) => question.isRequired);

    if (!answers.length) {
      if (hasRequiredQuestion) {
        throw new RecruitmentInvalidApplicationError('Toutes les questions obligatoires doivent etre renseignees.', {
          answers: ['required'],
        });
      }
      return [];
    }

    const questionsMap = new Map<string, any>(questions.map((question: any) => [question.id, question]));
    const payloadMap = new Map<string, RecruitmentAnswerPayloadDto>();

    for (const answer of answers) {
      if (!questionsMap.has(answer.questionId)) {
        throw new RecruitmentInvalidApplicationError('Question de recrutement invalide.', {
          answers: ['invalid_question'],
        });
      }
      if (payloadMap.has(answer.questionId)) {
        throw new RecruitmentInvalidApplicationError('Une question ne peut pas etre repondue plusieurs fois.', {
          answers: ['duplicate_question'],
        });
      }
      payloadMap.set(answer.questionId, answer);
    }

    const normalizedAnswers: RecruitmentApplicationAnswerInput[] = [];

    for (const question of questions) {
      const payload = payloadMap.get(question.id);
      if (!payload) {
        if (question.isRequired) {
          throw new RecruitmentInvalidApplicationError(`La question "${question.prompt}" est obligatoire.`, {
            answers: ['required_question'],
          });
        }
        continue;
      }

      if (question.type === 'YES_NO') {
        if (typeof payload.boolean !== 'boolean') {
          throw new RecruitmentInvalidApplicationError(
            `La question "${question.prompt}" attend une reponse oui/non.`,
            { answers: ['boolean_required'] },
          );
        }

        normalizedAnswers.push({
          questionId: question.id,
          answerText: null,
          answerBoolean: payload.boolean,
        });
        continue;
      }

      const answerText = this.nullableString(payload.text ?? null);
      if (question.isRequired && !answerText) {
        throw new RecruitmentInvalidApplicationError(`La question "${question.prompt}" est obligatoire.`, {
          answers: ['required_question'],
        });
      }

      if (answerText) {
        normalizedAnswers.push({
          questionId: question.id,
          answerText,
          answerBoolean: null,
        });
      }
    }

    return normalizedAnswers;
  }

  private async validateCandidateEloEligibility(recruitment: any, candidateId: string): Promise<void> {
    const minElo = recruitment.minElo ?? null;
    const maxElo = recruitment.maxElo ?? null;

    if ((minElo === null || minElo === 0) && maxElo === null) {
      return;
    }

    if (!recruitment.gameId) {
      return;
    }

    const candidateGame = await this.repo.findPlayerGameForCandidate(candidateId, recruitment.gameId);
    const gameName = recruitment.game?.name ?? 'ce jeu';
    const minEloIsRequired = minElo !== null && minElo !== 0;

    if (!candidateGame && minEloIsRequired) {
      throw new RecruitmentInvalidApplicationError(
        `Vous devez configurer votre profil pour le jeu "${gameName}" avant de postuler a cette offre.`,
        { gameId: ['required_on_profile'] },
        { gameId: recruitment.gameId },
      );
    }

    const candidateElo = this.getHighestCandidateElo(candidateGame);

    if ((candidateElo === null || candidateElo === undefined) && minEloIsRequired) {
      throw new RecruitmentInvalidApplicationError(
        `Vous devez renseigner votre classement ELO avant de postuler a cette offre.`,
        { elo: ['required'] },
        { gameId: recruitment.gameId },
      );
    }

    if (candidateElo === null || candidateElo === undefined) {
      return;
    }

    if (minElo !== null && candidateElo < minElo) {
      throw new RecruitmentInvalidApplicationError(
        `Votre classement ELO (${candidateElo}) est inferieur au minimum requis (${minElo}).`,
        { elo: ['too_low'] },
        { candidateElo, minElo },
      );
    }

    if (maxElo !== null && candidateElo > maxElo) {
      throw new RecruitmentInvalidApplicationError(
        `Votre classement ELO (${candidateElo}) depasse le maximum autorise (${maxElo}).`,
        { elo: ['too_high'] },
        { candidateElo, maxElo },
      );
    }
  }

  private getHighestCandidateElo(candidateGame: any): number | null {
    const values = (candidateGame?.modeRanks ?? [])
      .map((modeRank: any) => modeRank.elo)
      .filter((elo: unknown): elo is number => typeof elo === 'number');

    if (!values.length) {
      return null;
    }

    return Math.max(...values);
  }

  private nullableString(value: string | null | undefined): string | null {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized.length ? normalized : null;
  }
}
