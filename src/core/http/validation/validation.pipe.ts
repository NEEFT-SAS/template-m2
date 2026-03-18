/*
#########################
##
# Ce fichier standardise les erreurs de validation DTO (class-validator).
#
# Comment ca marche:
# - Si un body est invalide (ex: email pas valide, password trop court...)
# - Nest va "throw" une BadRequest automatiquement
# - Et ici on la transforme en format front friendly:
#
# Exemple de reponse:
# {
#   "code": "VALIDATION_ERROR",
#   "message": "Validation failed",
#   "fields": {
#     "email": ["email must be an email"],
#     "password": ["password must be longer than or equal to 8 characters"]
#   }
# }
#
#
#########################
*/

import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { createRequire } from 'module';

type FieldsErrorsMap = Record<string, string[]>;

function flattenToFieldsMap(errors: ValidationError[], parentPath = ''): FieldsErrorsMap {
  const fields: FieldsErrorsMap = {};

  for (const err of errors) {
    const fieldPath = parentPath ? `${parentPath}.${err.property}` : err.property;

    if (err.constraints) {
      fields[fieldPath] = Object.values(err.constraints);
    }

    if (err.children && err.children.length > 0) {
      const childFields = flattenToFieldsMap(err.children, fieldPath);

      for (const [key, value] of Object.entries(childFields)) {
        fields[key] = value;
      }
    }
  }

  return fields;
}

export function buildGlobalValidationPipe() {
  const sharedTransformerPackage = (() => {
    try {
      const sharedRequire = createRequire(require.resolve('@neeft-sas/shared'));
      return sharedRequire('class-transformer');
    } catch {
      return undefined;
    }
  })();

  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    stopAtFirstError: false,
    transformerPackage: sharedTransformerPackage,
    exceptionFactory: (errors) => {
      const fields = flattenToFieldsMap(errors);

      return new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fields,
      });
    },
  });
}
