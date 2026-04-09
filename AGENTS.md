# NEEFT Back V4 - AI Instructions

Ce fichier definit les conventions que toute IA doit respecter dans ce repository.
Objectif: produire du code coherent avec l'architecture actuelle, sans casser les contrats API/front.

## 1) Stack et structure

- Framework: NestJS + TypeScript.
- Architecture: `core/` + `contexts/` (feature-first).
- Pattern principal: DDD leger par contexte.

Organisation attendue par contexte:

- `api/` -> controllers, gateways, DTO d'entree
- `app/` -> use cases, services applicatifs, ports
- `domain/` -> types metier, erreurs metier, events
- `infra/` -> persistence TypeORM, adapters, realtime

Regle:

- Pas de logique metier lourde dans les controllers/gateways.
- Priorite aux `app/usecases` pour porter les scenarios metier.
- `app/services` doit rester minimal: uniquement des briques transverses, ultra reutilisables et partagees entre plusieurs usecases.
- Si une logique n'est utilisee que par un seul usecase, la garder dans ce usecase (ne pas creer de service).

## 2) Conventions API HTTP globales

L'application applique globalement:

- `buildGlobalValidationPipe()` (DTO validation)
- `HttpExceptionFilter` (normalisation erreur)
- `ResponseInterceptor` (normalisation succes)

### 2.1 Format success (obligatoire)

- Toute reponse HTTP success doit etre en forme:
  - `{ data: ... }`
- Pagination/meta:
  - `{ data: ..., meta: ... }`

Ne pas contourner ce format.

### 2.2 Format erreur (obligatoire)

- Format cible:
  - `{ code: string, message: string, fields?: Record<string, string[]>, details?: unknown }`
- Les erreurs metier doivent etre lancees via `DomainError` (ou classes derives dans `domain/errors`).

### 2.3 Validation DTO

- Le pipe global impose:
  - `transform: true`
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
- Les erreurs de validation doivent remonter avec:
  - `code: 'VALIDATION_ERROR'`
  - `message: 'Validation failed'`
  - `fields`

## 3) Auth et identite

- Les endpoints/gateways proteges utilisent les guards existants (`ConnectedGuard`, etc.).
- HTTP:
  - ID profil courant via `req.user?.pid`.
- WebSocket:
  - ID profil courant via `client.data.user.pid`.
- Ne jamais hardcoder un user id.

## 4) Checklist rapide pour l'IA

Avant de coder:

- Identifier le contexte concerne (`contexts/<name>`).
- Verifier si un use case/service existe deja.
- Verifier les DTO partages existants dans `@neeft-sas/shared`.

Avant de livrer:

- Respect du format success/erreur.
- Validation DTO active.
- Tests et build passent.