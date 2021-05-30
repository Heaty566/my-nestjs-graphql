import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

//---- Entity
import { UserRole } from './user.interface';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: '' })
    username: string;

    @Column({ default: '' })
    password: string;

    @Column({ nullable: false })
    name: string;

    @Column({ default: '' })
    avatarUrl: string;

    @Column({ default: '', unique: true })
    googleId: string;

    @Column({ default: '', unique: true })
    facebookId: string;

    @Column({ default: '', unique: true })
    githubId: string;

    @Column({ default: new Date().toISOString().slice(0, 19).replace('T', ' ') })
    createDate: Date;

    @Column({ default: UserRole.USER.toString() })
    role: UserRole;

    @Column({ default: false })
    isDisabled: boolean;

    @Column({ default: '' })
    email: string;

    @Column({ default: '' })
    phone: string;
}

export default User;
