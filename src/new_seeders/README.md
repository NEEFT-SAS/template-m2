# new_seeders

Ce dossier contient une version compatible ORM v4 des scripts legacy de `src/seeders`.

## Scripts principaux

- `run-seeders.ts`: exécute le seeding resources via `src/core/database/seeds`.
- `backfill-profile-scores.ts`: recalcule les scores équipes et, optionnellement, force la resync Typesense des joueurs.
- `cleanup-orphan-users.ts`: nettoie les credentials sans profil lié.
- `normalize-slugs.ts`: normalise les slugs profils + équipes, avec garantie d’unicité croisée.
- `process-affiliate-statuses.ts`: guard explicite (flux legacy Stripe retiré en v4).

## Variables utiles

- `BACKFILL_SKIP_TEAMS=true` pour ignorer le recalcul score team.
- `BACKFILL_PLAYER_SEARCH=true` pour forcer une resync Typesense players.
- `ORPHAN_USERS_DRY_RUN=true`, `ORPHAN_USERS_VERBOSE=true`, `ORPHAN_USERS_BATCH_SIZE=200`.
- `SLUG_DRY_RUN=true`, `SLUG_VERBOSE=true`, `SLUG_BATCH_SIZE=200`.

## Legacy migrations

Les scripts `legacy-*-migration` sont présents comme garde-fous: ils échouent volontairement avec un message explicite tant qu’une migration métier v4 dédiée n’est pas implémentée.
