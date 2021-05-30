import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UserModule } from '../user/user.module';
import { ReTokenRepository } from './entities/re-token.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoogleStrategy } from './passport/google.strategy';
import { FacebookStrategy } from './passport/facebook.strategy';
import { GithubStrategy } from './passport/github.strategy';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { RedisModule } from 'src/utils/redis/redis.module';

@Module({
    imports: [TypeOrmModule.forFeature([ReTokenRepository]), UserModule, RedisModule],
    controllers: [AuthController],
    providers: [
        AuthResolver,
        AuthService,
        AuthService,
        GoogleStrategy, // GOOGLE
        FacebookStrategy, // FACEBOOK
        GithubStrategy, // GITHUB
        {
            provide: JwtService,
            useFactory: () => {
                return new JwtService({ secret: process.env.JWT_SECRET_KEY });
            },
        },
    ],
    exports: [AuthService],
})
export class AuthModule {}
