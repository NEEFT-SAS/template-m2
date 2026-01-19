/*
#########################
##
# Ce fichier sert a throw des erreurs metier propres dans toute l'app (DDD).
#
# Comment on l'utilise:
# - Dans un usecase/service (auth, players, teams, recruitment...):
#   throw new DomainError({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials', statusCode: 401 })
#
# Ensuite, HttpExceptionFilter (le global error handler) va transformer automatiquement
# cette erreur en reponse API propre:
#   { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials', details?: {...} }
#
#
#########################
*/

export type DomainErrorDetails = {
  field?: string;
  reason?: string;
  [key: string]: unknown;
};

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: DomainErrorDetails;

  constructor(params: { code: string; message: string; statusCode: number; details?: DomainErrorDetails }) {
    super(params.message);

    this.code = params.code;
    this.statusCode = params.statusCode;
    this.details = params.details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
