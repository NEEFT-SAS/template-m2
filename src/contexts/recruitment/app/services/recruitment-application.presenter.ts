const toId = (value: unknown): number | null => {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1) return null;
  return numeric;
};

const mapPosition = (position: any) => {
  const id = toId(position?.id);
  if (!id) return null;

  return {
    id,
    name: position.name ?? null,
    slug: position.slug ?? null,
    icon: position.icon ?? null,
  };
};

const mapMode = (modeRelation: any) => {
  const mode = modeRelation?.mode;
  const id = toId(mode?.id);
  if (!id) return null;

  return {
    id,
    name: mode.name ?? null,
    slug: mode.slug ?? null,
  };
};

const mapRank = (rankRelation: any) => {
  const rank = rankRelation?.rank;
  const id = toId(rank?.id);
  if (!id) return null;

  return {
    id,
    name: rank.name ?? null,
    slug: rank.slug ?? null,
    icon: rank.icon ?? null,
    division: rank.division ?? null,
    tier: rank.tier ?? null,
  };
};

const pickPrimaryModeRank = (modeRanks: any[]) => {
  const ranked = [...modeRanks].sort((left, right) => {
    const rightElo = typeof right?.elo === 'number' ? right.elo : -1;
    const leftElo = typeof left?.elo === 'number' ? left.elo : -1;
    if (rightElo !== leftElo) return rightElo - leftElo;

    const rightOrder = Number(right?.rank?.order ?? right?.rank?.rank?.order ?? 0);
    const leftOrder = Number(left?.rank?.order ?? left?.rank?.rank?.order ?? 0);
    return rightOrder - leftOrder;
  });

  return ranked[0] ?? null;
};

const mapCandidateGame = (candidateGame: any) => {
  if (!candidateGame) return null;

  const primaryModeRank = pickPrimaryModeRank(candidateGame.modeRanks ?? []);

  return {
    game: candidateGame.rscGame
      ? {
          id: candidateGame.rscGame.id,
          name: candidateGame.rscGame.name,
          slug: candidateGame.rscGame.slug,
          icon: candidateGame.rscGame.icon ?? null,
        }
      : null,
    rank: mapRank(primaryModeRank?.rank),
    mode: mapMode(primaryModeRank?.mode),
    elo: typeof primaryModeRank?.elo === 'number' ? primaryModeRank.elo : null,
    positions: (candidateGame.positions ?? [])
      .map((relation: any) => mapPosition(relation.position))
      .filter(Boolean),
  };
};

export const resolveApplicationCandidateGame = async (repo: any, application: any) => {
  const candidateId = String(application?.candidateId ?? application?.candidate?.id ?? '').trim();
  const gameId = toId(application?.recruitment?.gameId ?? application?.recruitment?.game?.id);

  if (!candidateId || !gameId) return null;
  return repo.findPlayerGameForCandidate(candidateId, gameId);
};

export const mapRecruitmentApplicationPresenter = (application: any, candidateGame: any = null) => ({
  id: application.id,
  recruitmentId: application.recruitmentId ?? application.recruitment?.id,
  candidateId: application.candidateId ?? application.candidate?.id,
  status: application.status,
  motivation: application.motivation ?? null,
  positionId: application.positionId ?? application.position?.id ?? null,
  rejectReason: application.rejectReason ?? null,
  candidate: application.candidate
    ? {
        id: application.candidate.id,
        slug: application.candidate.slug,
        username: application.candidate.username,
        firstName: application.candidate.firstname ?? null,
        lastName: application.candidate.lastname ?? null,
        description: application.candidate.description ?? null,
        citation: application.candidate.citation ?? null,
        avatarUrl: application.candidate.profilePicture ?? null,
        profilePicture: application.candidate.profilePicture ?? null,
        bannerPicture: application.candidate.bannerPicture ?? null,
      }
    : null,
  candidateGame: mapCandidateGame(candidateGame),
  position: application.position
    ? {
        id: application.position.id,
        name: application.position.position?.name ?? null,
        slug: application.position.position?.slug ?? null,
        icon: application.position.position?.icon ?? null,
      }
    : null,
  recruitment: application.recruitment
    ? {
        id: application.recruitment.id,
        slug: application.recruitment.slug,
        title: application.recruitment.title,
        target: application.recruitment.target,
        team: application.recruitment.team
          ? {
              id: application.recruitment.team.id,
              slug: application.recruitment.team.slug,
              name: application.recruitment.team.name,
            }
          : null,
      }
    : null,
  answers: (application.answers ?? []).map((answer: any) => ({
    id: answer.id,
    questionId: answer.questionId ?? answer.question?.id,
    title: answer.question?.prompt ?? null,
    type: answer.question?.type ?? null,
    isRequired: answer.question?.isRequired ?? null,
    required: answer.question?.isRequired ?? null,
    order: answer.question?.order ?? null,
    valueText: answer.answerText ?? null,
    valueBoolean: answer.answerBoolean ?? null,
  })),
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  deletedAt: application.deletedAt ?? null,
});
