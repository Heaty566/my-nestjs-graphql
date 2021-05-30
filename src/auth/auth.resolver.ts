import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Response } from 'express';
import { apiResponse } from 'src/app/interface/apiResponse';
import User from '../user/entities/user.entity';
import { JoiValidatorPipe } from 'src/utils/validator/validator.pipe';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { RegisterUserDTO, vRegisterUserDto } from './dto/registerUserDto';
import { config } from 'src/config';
import { LoginUserDTO, vLoginUserDto } from './dto/loginUserDto';

@Resolver('Auth')
export class AuthResolver {
    constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

    @Mutation(() => Boolean)
    async registerUser(@Context('res') res: Response, @Args('input', new JoiValidatorPipe(vRegisterUserDto)) body: RegisterUserDTO) {
        const isUserExist = await this.userService.findOneByField('username', body.username);
        if (isUserExist) throw apiResponse.sendError(400, { username: { type: 'field.field-taken' } });

        //create and insert new user
        const newUser = new User();
        newUser.username = body.username;
        newUser.name = body.name;
        newUser.password = await this.authService.encryptString(body.password);
        newUser.avatarUrl = '';
        const insertedUser = await this.userService.save(newUser);

        //return token
        const reToken = await this.authService.createReToken(insertedUser);
        res.cookie('re-token', reToken, { maxAge: config.authController.registerCookieTime });
        return true;
    }

    @Mutation(() => Boolean)
    async loginUser(@Context('res') res: Response, @Args('input', new JoiValidatorPipe(vLoginUserDto)) body: LoginUserDTO) {
        //checking user is exist or not
        const isUserExist = await this.userService.findOneByField('username', body.username);
        if (!isUserExist) throw apiResponse.sendError(400, { errorMessage: { type: 'error.invalid-password-username' } });

        //checking hash password
        const isCorrect = await this.authService.decryptString(body.password, isUserExist.password);
        if (!isCorrect) throw apiResponse.sendError(400, { errorMessage: { type: 'error.invalid-password-username' } });

        //return token
        const reToken = await this.authService.createReToken(isUserExist);
        res.cookie('re-token', reToken, { maxAge: config.authController.loginCookieTime });
        return true;
    }
}
