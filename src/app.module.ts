import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ReToken } from './auth/entities/re-token.entity';
import User from './user/entities/user.entity';
import { GraphQLError, GraphQLFormattedError } from 'graphql';

const Config = ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: `./config/.env.${process.env.NODE_ENV}`,
});

const DBConfig = TypeOrmModule.forRoot({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    keepConnectionAlive: true,
    entities: [ReToken, User],
    extra: { connectionLimit: 10 },
});

@Module({
    imports: [
        Config,
        DBConfig,
        GraphQLModule.forRoot({
            autoSchemaFile: true,
            cors: {
                origin: [`${process.env.CLIENT_URL}`],
                credentials: true,
            },
            path: '/api/graphql',
            context: ({ req, res }) => ({
                req,
                res,
            }),
            formatError: (error: GraphQLError) => {
                console.log(error);
                const graphQLFormattedError: GraphQLFormattedError = {
                    message: error.extensions.details,
                    extensions: {
                        status: error.extensions.statusCode,
                    },
                };
                return graphQLFormattedError;
            },
        }),
        AuthModule,
        UserModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
