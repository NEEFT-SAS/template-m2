# README SCORE EQUIPE

## Objectif
Definir un cadre clair pour les 3 scores equipe:
- `completenessScore`: taux de completion du profil equipe.
- `trustScore`: score de confiance equipe.
- `profileScore`: score global de ranking.

## Regles globales
- Echelle: `0 -> 100`.
- Tous les scores sont stockes en entier (`Math.round`).
- Clamp systematique: `Math.max(0, Math.min(100, score))`.
- `profileScore` est recalcule apres chaque recalcul de `completenessScore` ou `trustScore`.

## Formule profileScore
```txt
profileScore = round(0.65 * completenessScore + 0.35 * trustScore)
```

## CompletenessScore (Equipe)
Principe: on ajoute des points si le profil structure est complet.  
Perte: supprimer/vider un element retire les points associes.

| Critere | Gain |
|---|---:|
| Logo renseigne | +12 |
| Banniere renseignee | +8 |
| Description >= 20 caracteres | +5 |
| Description >= 80 caracteres | +5 supplementaires |
| Quote renseignee | +3 |
| Date de creation (`foundedAt`) renseignee | +4 |
| Ville renseignee | +3 |
| Pays renseigne | +5 |
| 1 langue | +5 |
| 2 langues ou plus | +5 supplementaires |
| Au moins 1 membre equipe | +10 |
| 3 membres ou plus | +5 supplementaires |
| Au moins 1 roster | +10 |
| Au moins 1 roster actif | +10 |
| Roster actif correctement staffe (>=3 membres) | +10 |

## TrustScore (Equipe)
Principe: base neutre + bonus de fiabilite - malus de risque.

Base:
- `trustScore` initial = `50`.

### Gains
| Signal | Gain |
|---|---:|
| Equipe verifiee (`teams.is_verified = true`) | +25 |
| Owner avec email verifie | +10 |
| Owner avec compte actif | +10 |
| Anciennete equipe >= 30 jours | +5 |
| Anciennete equipe >= 180 jours | +5 supplementaires |
| Au moins 1 roster actif recemment mis a jour | +10 |
| Aucun report non resolu cible equipe | +5 |

### Pertes
| Signal | Malus |
|---|---:|
| 1 a 2 reports non resolus cible equipe | -10 |
| 3 a 5 reports non resolus cible equipe | -20 |
| >5 reports non resolus cible equipe | -35 |
| Report resolu avec issue defavorable (fraude/abus confirme) | -15 par report (max -30) |
| Owner suspendu | -30 |
| Aucun roster actif | -15 |
| Equipe inactive (aucune MAJ utile > 90 jours) | -10 |

## Evenements de recalcul
- Creation / update profil equipe (logo, banniere, description, etc.).
- Ajout/suppression de langues.
- Ajout/suppression de membres equipe.
- Ajout/suppression/mise a jour de roster et roster members.
- Changement `is_verified`.
- Changement du statut du owner.
- Creation ou changement de statut d un report cible equipe.

## Note de migration
Etat actuel:
- Les colonnes `completeness_score` et `trust_score` existent deja en base.
- La recherche equipe trie deja par `trustScore`, puis `completenessScore`.
- `profileScore` renvoye dans la recherche equipe correspond aujourd hui a `completenessScore` (a remplacer par la formule ci-dessus).
