import { createConnection } from 'mysql2/promise';

async function seed() {
  const connection = await createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'neeft_v4',
  });

  try {
    // 1. Get a team ID
    const [teams]: any = await connection.execute('SELECT id FROM teams LIMIT 1');
    if (teams.length === 0) {
      console.log('Aucune team trouvée dans la DB ! Créez une team d\'abord.');
      process.exit(1);
    }
    const teamId = teams[0].id;

    // 2. Get a game ID
    const [games]: any = await connection.execute('SELECT id FROM rsc_games LIMIT 1');
    let gameId = null;
    if (games.length > 0) {
      gameId = games[0].id;
    }

    // 3. Create a UUID for the recruitment
    const { randomUUID } = require('crypto');
    const id = randomUUID();

    // 4. Insert recruitment
    await connection.execute(`
      INSERT INTO team_recruitments 
      (id, team_id, title, slug, summary, description, target, game_id, urgent, is_paid, is_published, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      id,
      teamId,
      'Recherche Jungler Diamant+',
      'recherche-jungler-diamant-' + Math.floor(Math.random() * 10000),
      'Nous recherchons un Jungler sérieux pour tryhard le prochain split de la ligue régionale.',
      'Description très détaillée du poste : entrainement 3 fois par semaine, VOD reviews le week-end, coach à disposition.',
      'MEMBER',
      gameId,
      true, // urgent
      false, // is_paid
      true, // is_published
    ]);

    console.log(`✅ Offre de recrutement insérée avec succès ! (ID : ${id})`);
  } catch (err) {
    console.error('Erreur SQL :', err);
  } finally {
    await connection.end();
  }
}

seed();
