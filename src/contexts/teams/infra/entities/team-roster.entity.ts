import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId, Unique, UpdateDateColumn } from 'typeorm';
import { TeamEntity } from './team.entity';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { TeamRosterMemberEntity } from './team-roster-member.entity';

@Entity('team_rosters')
@Unique(['team', 'slug'])
export class TeamRosterEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => TeamEntity, (team) => team.rosters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team!: TeamEntity;

  @RelationId((roster: TeamRosterEntity) => roster.team)
  teamId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @ManyToOne(() => RscGameEntity, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'game_id' })
  game!: RscGameEntity;

  @RelationId((roster: TeamRosterEntity) => roster.game)
  gameId!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => TeamRosterMemberEntity, (rosterMember) => rosterMember.roster, {
    cascade: ['insert', 'update'],
  })
  members?: TeamRosterMemberEntity[];

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;
}
