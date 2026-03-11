import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { TeamRosterEntity } from '@/contexts/teams/infra/entities/team-roster.entity';
import { TeamRosterMemberEntity } from '@/contexts/teams/infra/entities/team-roster-member.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { SearchTeamsQueryDto } from '@neeft-sas/shared';
import type {
  SearchTeamGamePresenter,
  SearchTeamPresenter,
  SearchTeamsPresenter,
} from '@neeft-sas/shared';

@Injectable()
export class SearchTeamsQuery {
  constructor(
    @InjectRepository(TeamEntity)
    private readonly teamsRepo: Repository<TeamEntity>,
  ) {}

  async execute(query: SearchTeamsQueryDto): Promise<SearchTeamsPresenter> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const offset = (page - 1) * perPage;

    const idsQb = this.teamsRepo
      .createQueryBuilder('team')
      .select('team.id', 'id')
      .distinct(true);

    this.applyFilters(idsQb, query);

    const totalRow = await idsQb
      .clone()
      .select('COUNT(DISTINCT team.id)', 'total')
      .getRawOne<{ total?: number | string }>();
    const found = Number(totalRow?.total ?? 0);

    const idRows = await idsQb
      .clone()
      .orderBy('team.trustScore', 'DESC')
      .addOrderBy('team.completenessScore', 'DESC')
      .addOrderBy('team.name', 'ASC')
      .offset(offset)
      .limit(perPage)
      .getRawMany<{ id?: string }>();

    const teamIds = idRows
      .map((row) => String(row.id ?? '').trim())
      .filter(Boolean);

    if (!teamIds.length) {
      return {
        data: [],
        meta: {
          found,
          page,
          perPage,
          outOf: 0,
        },
      };
    }

    const teams = await this.teamsRepo
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.country', 'country')
      .leftJoinAndSelect('team.languages', 'language')
      .leftJoinAndSelect('team.members', 'teamMember')
      .leftJoinAndSelect('team.rosters', 'roster')
      .leftJoinAndSelect('roster.game', 'game')
      .leftJoinAndSelect('roster.members', 'rosterMember')
      .leftJoinAndSelect('rosterMember.member', 'rosterTeamMember')
      .where('team.id IN (:...teamIds)', { teamIds })
      .getMany();

    const byId = new Map(teams.map((team) => [team.id, team]));
    const orderedTeams = teamIds
      .map((id) => byId.get(id))
      .filter((team): team is TeamEntity => Boolean(team));

    const data = orderedTeams.map((team) =>
      this.toPresenter(team, query.gameId),
    );

    return {
      data,
      meta: {
        found,
        page,
        perPage,
        outOf: data.length,
      },
    };
  }

  private applyFilters(
    qb: SelectQueryBuilder<TeamEntity>,
    query: SearchTeamsQueryDto,
  ) {
    const normalizedQ = String(query.q ?? '')
      .trim()
      .toLowerCase();
    if (normalizedQ) {
      qb.andWhere(
        `
        (
          LOWER(team.name) LIKE :q
          OR LOWER(team.slug) LIKE :q
          OR LOWER(team.acronym) LIKE :q
        )
        `,
        { q: `%${normalizedQ}%` },
      );
    }

    if (query.countryId) {
      qb.andWhere('team.country_id = :countryId', { countryId: query.countryId });
    }

    if (query.languageIds?.length) {
      qb.innerJoin(
        'team_languages',
        'teamLanguagesFilter',
        `
        teamLanguagesFilter.team_id = team.id
        AND teamLanguagesFilter.language_id IN (:...languageIds)
        `,
        { languageIds: query.languageIds },
      );
    }

    if (query.gameId !== undefined) {
      qb.innerJoin(
        'team_rosters',
        'teamRostersFilter',
        `
        teamRostersFilter.team_id = team.id
        AND teamRostersFilter.game_id = :gameId
        `,
        { gameId: query.gameId },
      );
    }

    if (query.teamStatus === 'active' || query.teamStatus === 'open') {
      qb.andWhere(
        `
        EXISTS (
          SELECT 1
          FROM team_rosters tr_status
          WHERE tr_status.team_id = team.id
            AND tr_status.is_active = 1
        )
        `,
      );
    } else if (query.teamStatus === 'full') {
      qb.andWhere(
        `
        NOT EXISTS (
          SELECT 1
          FROM team_rosters tr_status
          WHERE tr_status.team_id = team.id
            AND tr_status.is_active = 1
        )
        `,
      );
    }
  }

  private toPresenter(team: TeamEntity, preferredGameId?: number): SearchTeamPresenter {
    const countryCode = String(team.country?.code ?? '')
      .trim()
      .toUpperCase();

    const languageFlags = Array.from(
      new Set(
        (team.languages ?? [])
          .map((language) => String(language.code ?? '').trim().toUpperCase())
          .filter(Boolean),
      ),
    );

    const flags = languageFlags.length
      ? languageFlags
      : countryCode
        ? [countryCode]
        : [];

    const activeRosters = (team.rosters ?? []).filter((roster) => roster.isActive);
    const openings = activeRosters.length;
    const recruitLabel = openings > 0 ? 'Recrute' : 'Complet';

    const games = this.mapGames(team, preferredGameId);

    return {
      slug: team.slug,
      name: team.name,
      handle: `@${team.slug}`,
      logoUrl: String(team.logoPicture ?? ''),
      bannerUrl: String(team.bannerPicture ?? ''),
      heroTheme: this.resolveTheme(team.slug),
      flags,
      trustScore: Number(team.trustScore ?? 0),
      profileScore: Number(team.completenessScore ?? 0),
      legalType: (team.organizationType ?? 'ASSOCIATION') as SearchTeamPresenter['legalType'],
      openings,
      countryCode,
      games,
      activeGameKey: games[0]?.key,
      recruitLabel,
    };
  }

  private mapGames(team: TeamEntity, preferredGameId?: number): SearchTeamGamePresenter[] {
    const teamMembers = Array.isArray(team.members) ? team.members : [];
    const teamPlayersCount = this.countUniqueTeamMembersByRole(
      teamMembers,
      (role) => role === 'PLAYER',
    );
    const teamStaffCount = this.countUniqueTeamMembersByRole(
      teamMembers,
      (role) => role !== 'PLAYER',
    );

    const grouped = new Map<
      number,
      {
        name: string;
        shortName: string | null;
        slug: string;
        icon: string | null;
        rosters: TeamRosterEntity[];
      }
    >();

    for (const roster of team.rosters ?? []) {
      const game = roster.game;
      if (!game?.id) continue;

      const existing = grouped.get(game.id);
      if (existing) {
        existing.rosters.push(roster);
        continue;
      }

      grouped.set(game.id, {
        name: game.name,
        shortName: game.shortName ?? null,
        slug: game.slug,
        icon: game.icon ?? null,
        rosters: [roster],
      });
    }

    const games = Array.from(grouped.entries()).map(([gameId, entry]) => {
      const playerIds = new Set<string>();
      const staffIds = new Set<string>();

      const rosterMembers = entry.rosters.flatMap(
        (roster) => roster.members ?? [],
      );

      for (const rosterMember of rosterMembers) {
        this.appendRosterMemberByRole(rosterMember, playerIds, staffIds);
      }

      const players =
        playerIds.size > 0 ? playerIds.size : teamPlayersCount;
      const staff =
        staffIds.size > 0 ? staffIds.size : teamStaffCount;

      return {
        gameId,
        key: entry.slug || String(gameId),
        name: entry.name,
        shortLabel:
          entry.shortName?.trim() ||
          entry.name.slice(0, 3).toUpperCase(),
        icon: entry.icon ?? 'uil:game-structure',
        composition: {
          rosters: entry.rosters.length,
          players,
          staff,
        },
        performance: {
          averageRank: '-',
          averagePr: String(
            Math.max(
              0,
              Math.min(
                100,
                Math.round((Number(team.trustScore) + Number(team.completenessScore)) / 2),
              ),
            ),
          ),
        },
      } satisfies SearchTeamGamePresenter & { gameId: number };
    });

    games.sort((left, right) => {
      const leftPreferred = preferredGameId !== undefined && left.gameId === preferredGameId;
      const rightPreferred = preferredGameId !== undefined && right.gameId === preferredGameId;
      if (leftPreferred !== rightPreferred) return leftPreferred ? -1 : 1;

      if (left.composition.rosters !== right.composition.rosters) {
        return right.composition.rosters - left.composition.rosters;
      }

      return left.name.localeCompare(right.name, 'fr');
    });

    return games.map(({ gameId: _gameId, ...game }) => game);
  }

  private appendRosterMemberByRole(
    rosterMember: TeamRosterMemberEntity,
    playerIds: Set<string>,
    staffIds: Set<string>,
  ) {
    const memberId = String(
      rosterMember.memberId ?? rosterMember.member?.id ?? '',
    ).trim();
    if (!memberId) return;

    const teamRole = String(rosterMember.member?.role ?? '')
      .trim()
      .toUpperCase();
    const rosterRole = String(rosterMember.role ?? '')
      .trim()
      .toUpperCase();

    const isPlayer =
      teamRole === 'PLAYER' ||
      rosterRole === 'CAPTAIN' ||
      rosterRole === 'MEMBER' ||
      rosterRole === 'SUBSTITUTE';

    const isStaff =
      !isPlayer ||
      rosterRole === 'COACH' ||
      rosterRole === 'ANALYST';

    if (isPlayer) {
      playerIds.add(memberId);
    }
    if (isStaff) {
      staffIds.add(memberId);
    }
  }

  private countUniqueTeamMembersByRole(
    members: TeamMemberEntity[],
    predicate: (role: string) => boolean,
  ) {
    const ids = new Set<string>();

    for (const member of members) {
      const memberId = String(member.id ?? '').trim();
      if (!memberId) continue;

      const role = String(member.role ?? '')
        .trim()
        .toUpperCase();
      if (!predicate(role)) continue;
      ids.add(memberId);
    }

    return ids.size;
  }

  private resolveTheme(seed: string): 'violet' | 'blue' {
    let hash = 0;
    for (const char of seed) {
      hash = (hash * 31 + char.charCodeAt(0)) | 0;
    }
    return Math.abs(hash) % 2 === 0 ? 'blue' : 'violet';
  }
}
