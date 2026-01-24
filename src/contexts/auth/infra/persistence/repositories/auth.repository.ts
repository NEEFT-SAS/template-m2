import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserAccountAccessStatus } from '@neeft-sas/shared';
import { DataSource, Repository } from 'typeorm';
import { UserCredentialsEntity } from '../entities/user-credentials.entity';
import { UserProfileEntity } from '../entities/user-profile.entity';
import { AuthRepositoryPort } from '@/contexts/auth/app/ports/auth.repository.port';
import { CreateCredentialsInput, CreateProfileInput } from '@/contexts/auth/app/types/auth.repository.types';

@Injectable()
export class AuthRepositoryTypeorm implements AuthRepositoryPort {
  constructor(
    @InjectRepository(UserCredentialsEntity) private readonly credentialsRepo: Repository<UserCredentialsEntity>,
    @InjectRepository(UserProfileEntity) private readonly profileRepo: Repository<UserProfileEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findCredentialsByEmail(email: string): Promise<UserCredentialsEntity | null> {
    const entity = await this.credentialsRepo.findOne({ where: { email } });
    return entity ? entity : null;
  }

  async findProfileByCredentialId(userCredentialId: string): Promise<UserProfileEntity | null> {
    const entity = await this.profileRepo.findOne({ where: { userCredentialId } });
    return entity ? entity : null;
  }

  async updateCredentialsLastLoginAt(userCredentialId: string, date: Date): Promise<void> {
    await this.credentialsRepo.update({ id: userCredentialId }, { lastLoginAt: date });
  }

  async existsCredentialsByEmail(email: string): Promise<boolean> {
    const row = await this.credentialsRepo.exists({ where: { email } });
    return !!row;
  }

  async existsProfileByUsername(username: string): Promise<boolean> {
    const row = await this.profileRepo.exists({ where: { username } });
    return !!row;
  }

  async existsProfileBySlug(slug: string): Promise<boolean> {
    const row = await this.profileRepo.exists({ where: { slug } });
    return !!row;
  }

  async findProfileByReferralCode(referralCode: string): Promise<UserProfileEntity | null> {
    const profile = await this.profileRepo.findOne({ where: { referralCode } });
    return profile ? profile : null;
  }

  /***
   *  Create user credentials and profile in a transaction
   * *  Returns the created records
   */
  async createCredentialsAndProfile(input: {
    credentials: CreateCredentialsInput;
    profile: CreateProfileInput;
    referredByUserId: string | null;
  }): Promise<{ credentials: UserCredentialsEntity; profile: UserProfileEntity }> {
    return this.dataSource.transaction(async (manager) => {
      const credentialsRepository = manager.getRepository(UserCredentialsEntity);
      const profileRepository = manager.getRepository(UserProfileEntity);

      const credentials = await credentialsRepository.save(
        credentialsRepository.create({
          email: input.credentials.email,
          passwordHash: input.credentials.passwordHash,
          isEmailVerified: false,
          status: input.credentials.status ?? UserAccountAccessStatus.ACTIVE,
          lastLoginAt: null,
        }),
      );

      const profile = await profileRepository.save(
        profileRepository.create({
          userCredentialId: credentials.id,
          username: input.profile.username,
          slug: input.profile.slug,
          birthDate: input.profile.birthDate,
          referralCode: input.profile.referralCode,
          referredByUserId: input.referredByUserId,
        }),
      );

      return {
        credentials: credentials,
        profile: profile,
      };
    });
  }
}
