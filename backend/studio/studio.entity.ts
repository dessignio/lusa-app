// backend/studio/studio.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { AdminUser } from '../admin-user/admin-user.entity';
import { Student } from '../student/student.entity';
import { Instructor } from '../instructor/instructor.entity';
import { Program } from '../program/program.entity';
import { ClassOffering } from '../class-offering/class-offering.entity';
import { MembershipPlanDefinitionEntity } from '../membership-plan/membership-plan.entity';

@Entity('studios')
export class Studio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @OneToOne(() => AdminUser)
  @JoinColumn({ name: 'owner_id' })
  owner: AdminUser;

  @Column({ name: 'stripe_account_id', type: 'varchar', nullable: true, unique: true })
  stripeAccountId: string | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => AdminUser, adminUser => adminUser.studio)
  adminUsers: AdminUser[];

  @OneToMany(() => Student, student => student.studio)
  students: Student[];

  @OneToMany(() => Instructor, instructor => instructor.studio)
  instructors: Instructor[];

  @OneToMany(() => Program, program => program.studio)
  programs: Program[];

  @OneToMany(() => ClassOffering, classOffering => classOffering.studio)
  classOfferings: ClassOffering[];

  @OneToMany(() => MembershipPlanDefinitionEntity, plan => plan.studio)
  membershipPlans: MembershipPlanDefinitionEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}