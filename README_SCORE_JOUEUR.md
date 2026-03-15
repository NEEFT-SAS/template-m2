# README SCORE JOUEUR

## Objectif
Definir un cadre clair pour les 3 scores joueur:
- `completenessScore`: taux de completion du profil.
- `trustScore`: score de confiance.
- `profileScore`: score global utilise pour le ranking.

## Regles globales
- Echelle: `0 -> 100`.
- Tous les scores sont stockes en entier (`Math.round`).
- Clamp systematique: `Math.max(0, Math.min(100, score))`.
- `profileScore` est recalcule apres chaque recalcul de `completenessScore` ou `trustScore`.

## Formule profileScore
```txt
profileScore = round(0.65 * completenessScore + 0.35 * trustScore)
```

## CompletenessScore (Joueur)
Principe: on ajoute des points si le profil est complete.  
Perte: supprimer/vider un element retire les points associes.

| Critere | Gain |
|---|---:|
| Photo de profil renseignee | +15 |
| Banniere renseignee | +5 |
| Description >= 20 caracteres | +5 |
| Description >= 80 caracteres | +5 supplementaires |
| Citation renseignee | +3 |
| Nationalite renseignee | +5 |
| 1 langue | +5 |
| 2 langues ou plus | +5 supplementaires |
| Experiences (max 3) | +5 par experience (max +15) |
| Experiences pro (max 3) | +5 par experience (max +15) |
| Formations (max 2) | +3 par formation (max +6) |
| Liens sociaux (max 5) | +2 par lien (max +10) |
| Badges (max 5) | +2 par badge (max +10) |

Note:
- Ce bareme est aligne avec la logique actuelle de calcul utilisee dans le moteur de recherche joueur.

## TrustScore (Joueur)
Principe: base neutre + bonus de fiabilite - malus de risque.

Base:
- `trustScore` initial = `50`.

### Gains
| Signal | Gain |
|---|---:|
| Email verifie (`user_credentials.is_email_verified = true`) | +20 |
| Compte actif (`status = active`) | +10 |
| Anciennete compte >= 30 jours | +10 |
| Anciennete compte >= 180 jours | +10 supplementaires |
| Connexion recente (`last_login_at <= 30 jours`) | +5 |
| Badge "verified" present | +10 |
| Aucun report non resolu | +5 |

### Pertes
| Signal | Malus |
|---|---:|
| 1 a 2 reports non resolus | -10 |
| 3 a 5 reports non resolus | -20 |
| >5 reports non resolus | -35 |
| Report resolu avec issue defavorable (fraude/abus confirme) | -15 par report (max -30) |
| Compte suspendu (`status = suspended`) | -40 |
| Inactif depuis >45 jours | -5 |
| Inactif depuis >90 jours | -10 |
| Inactif depuis >180 jours | -20 |
| Inactif depuis >365 jours | -30 |
| Jamais connecte (`last_login_at = null`) | -15 |

## Evenements de recalcul
- Mise a jour du profil joueur.
- Mise a jour des jeux joueur (modes/ranks/elo, recruitable, etc.).
- Mise a jour experiences/formation/liens sociaux/badges.
- Changement de verification email / status compte.
- Creation ou changement de statut d un report.
