import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { UserRepository } from './entities/user.repository';
import { AuthModule } from 'src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([UserRepository]), forwardRef(() => AuthModule)],
    providers: [UserResolver, UserService],
    exports: [UserService, TypeOrmModule],
})
export class UserModule {}
