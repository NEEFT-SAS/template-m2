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

export type DomainErrorFields = Record<string, string[]>;
export type DomainErrorDetails = Record<string, unknown>;

export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly fields?: DomainErrorFields;
  public readonly details?: DomainErrorDetails;

  constructor(params: {
    code: string;
    message: string;
    statusCode: number;
    fields?: DomainErrorFields;
    details?: DomainErrorDetails;
  }) {
    super(params.message);

    this.code = params.code;
    this.statusCode = params.statusCode;
    this.fields = params.fields;
    this.details = params.details;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
