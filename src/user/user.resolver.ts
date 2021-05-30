import { UseGuards } from '@nestjs/common';
import { Context, Resolver, Query } from '@nestjs/graphql';
import { Request } from 'express';
import { UserGuard } from 'src/auth/auth.guard';
import { UserSchema } from './entities/user.schema';
import { UserService } from './user.service';

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @UseGuards(UserGuard)
    @Query(() => UserSchema)
    async getCurrentUser(@Context('req') req: Request): Promise<UserSchema> {
        const user = await this.userService.findOneByField('id', req.user.id);
        console.log(user);
        return {
            phone: user.phone,
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            createDate: user.createDate,
            email: user.email,
            id: user.id,
        };
    }
}
