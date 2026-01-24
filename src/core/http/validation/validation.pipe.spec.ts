/*
#########################
# Tests: ValidationPipe -> VALIDATION_ERROR + fields map
#########################
*/

import { ArgumentMetadata } from '@nestjs/common';
import { IsEmail, MinLength } from 'class-validator';
import { buildGlobalValidationPipe } from './validation.pipe';

class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;
}

describe('buildGlobalValidationPipe', () => {
  it('throws VALIDATION_ERROR with fields', async () => {
    const pipe = buildGlobalValidationPipe();

    const metadata: ArgumentMetadata = { type: 'body', metatype: RegisterDto, data: '' };

    try {
      await pipe.transform({ email: 'bad', password: '123' }, metadata);
      fail('Expected transform to throw');
    } catch (err: any) {
      const res = err.getResponse();

      expect(res.code).toBe('VALIDATION_ERROR');
      expect(res.message).toBe('Validation failed');
      expect(res.fields.email).toBeDefined();
      expect(res.fields.password).toBeDefined();
    }
  });
});
