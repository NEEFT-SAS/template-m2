import { PasswordHasherPort } from '@/contexts/auth/app/ports/password-hasher.port';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasherPort {
  async hash(raw: string): Promise<string> {
    return bcrypt.hash(raw, 12);
  }

  async compare(raw: string, hash: string): Promise<boolean> {
    return bcrypt.compare(raw, hash);
  }
}
