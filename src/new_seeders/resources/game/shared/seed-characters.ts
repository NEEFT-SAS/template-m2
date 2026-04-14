import { DataSource } from 'typeorm';
import { logSection, seedIfNotExists } from '@/new_seeders/helpers/seeder-utils';
import { RscCharacterEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-characters.entity';

const DDRAGON_VERSION = '15.23.1';

type LolChampionListResponse = {
  data: Record<string, { id: string; name: string }>;
};

async function fetchLolChampions(): Promise<Partial<RscCharacterEntity>[]> {
  try {
    const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/data/en_US/champion.json`);
    if (!response.ok) throw new Error(`DDragon returned ${response.status}`);

    const payload = (await response.json()) as LolChampionListResponse;
    if (!payload?.data) return [];

    return Object.values(payload.data).map((champion) => ({
      name: champion.name,
      slug: `lol-${champion.id.toLowerCase()}`,
      icon: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg`,
    }));
  } catch (error) {
    console.error('⚠️  Unable to fetch League of Legends champions', error);
    return [];
  }
}

type ValorantAgentsResponse = {
  status: number;
  data: Array<{
    displayName: string;
    isPlayableCharacter: boolean;
    uuid: string;
    displayIcon: string | null;
  }>;
};

async function fetchValorantAgents(): Promise<Partial<RscCharacterEntity>[]> {
  try {
    const response = await fetch('https://valorant-api.com/v1/agents?isPlayableCharacter=true');
    if (!response.ok) throw new Error(`Valorant API returned ${response.status}`);

    const payload = (await response.json()) as ValorantAgentsResponse;
    if (!payload?.data) return [];

    return payload.data
      .filter((agent) => agent.isPlayableCharacter)
      .map((agent) => ({
        name: agent.displayName,
        slug: `val-${agent.displayName.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`,
        icon: agent.displayIcon ?? undefined,
      }));
  } catch (error) {
    console.error('⚠️  Unable to fetch Valorant agents', error);
    return [];
  }
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .replace(/-+/g, '-');
}

type BrawlifyBrawlersResponse = { list: Array<{ name: string; released: boolean; imageUrl2?: string }> };

async function fetchBrawlStarsBrawlers(): Promise<Partial<RscCharacterEntity>[]> {
  try {
    const res = await fetch('https://api.brawlify.com/v1/brawlers');
    if (!res.ok) throw new Error(`Brawlify API error: ${res.status} ${res.statusText}`);

    const data = (await res.json()) as BrawlifyBrawlersResponse;
    if (!data?.list?.length) return [];

    return data.list
      .filter((brawler) => brawler.released)
      .map((brawler) => ({
        name: brawler.name,
        slug: toSlug(brawler.name),
        icon: brawler.imageUrl2 ?? undefined,
      }));
  } catch (error) {
    console.error('⚠️  Unable to fetch Brawl Stars brawlers', error);
    return [];
  }
}

const applyPrefix = (prefix: string, list: Partial<RscCharacterEntity>[]): Partial<RscCharacterEntity>[] =>
  list.map((character) => ({
    ...character,
    slug: character.slug?.startsWith(`${prefix}-`) ? character.slug : `${prefix}-${character.slug}`,
  }));

const apexLegends: Partial<RscCharacterEntity>[] = [
  { name: 'Ash', slug: 'ash', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/2/26/Ash.png' },
  { name: 'Ballistic', slug: 'ballistic', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/8/89/Ballistic.png' },
  { name: 'Bangalore', slug: 'bangalore', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/b/b7/Bangalore.png' },
  { name: 'Bloodhound', slug: 'bloodhound', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/f/f3/Bloodhound.png' },
  { name: 'Catalyst', slug: 'catalyst', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/4/4d/Catalyst.png' },
  { name: 'Caustic', slug: 'caustic', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/8/8a/Caustic.png' },
  { name: 'Conduit', slug: 'conduit', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/0/0c/Conduit.png' },
  { name: 'Crypto', slug: 'crypto', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/7/7a/Crypto.png' },
  { name: 'Fuse', slug: 'fuse', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/5/53/Fuse.png' },
  { name: 'Gibraltar', slug: 'gibraltar', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/8/83/Gibraltar.png' },
  { name: 'Horizon', slug: 'horizon', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/f/fd/Horizon.png' },
  { name: 'Lifeline', slug: 'lifeline', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/4/49/Lifeline.png' },
  { name: 'Loba', slug: 'loba', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/4/4d/Loba.png' },
  { name: 'Mad Maggie', slug: 'mad-maggie', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/2/27/Mad_Maggie.png' },
  { name: 'Mirage', slug: 'mirage', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/2/28/Mirage.png' },
  { name: 'Newcastle', slug: 'newcastle', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/9/9f/Newcastle.png' },
  { name: 'Octane', slug: 'octane', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/9/9b/Octane.png' },
  { name: 'Pathfinder', slug: 'pathfinder', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/a/a8/Pathfinder.png' },
  { name: 'Rampart', slug: 'rampart', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/3/3c/Rampart.png' },
  { name: 'Revenant', slug: 'revenant', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/b/b2/Revenant.png' },
  { name: 'Seer', slug: 'seer', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/0/0d/Seer.png' },
  { name: 'Valkyrie', slug: 'valkyrie', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/9/90/Valkyrie.png' },
  { name: 'Vantage', slug: 'vantage', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/5/5b/Vantage.png' },
  { name: 'Wattson', slug: 'wattson', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/8/83/Wattson.png' },
  { name: 'Wraith', slug: 'wraith', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/f/f4/Wraith.png' },
  { name: 'Alter', slug: 'alter', icon: 'https://static.wikia.nocookie.net/apexlegends_gamepedia_en/images/9/94/Alter.png' },
];

export async function seedCharacters(dataSource: DataSource) {
  const repo = dataSource.getRepository(RscCharacterEntity);
  logSection('CHARACTERS');

  const [lolChampions, valorantAgents, brawlStarsBrawlers] = await Promise.all([
    fetchLolChampions(),
    fetchValorantAgents(),
    fetchBrawlStarsBrawlers(),
  ]);

  const characters: Partial<RscCharacterEntity>[] = [
    ...lolChampions,
    ...valorantAgents,
    ...applyPrefix('apex', apexLegends),
    ...applyPrefix('brawl', brawlStarsBrawlers),
  ];

  for (const character of characters) {
    if (!character.slug) continue;
    await seedIfNotExists(repo, { slug: character.slug }, character);
  }

  console.log('✅ Characters seeded successfully!');
}
