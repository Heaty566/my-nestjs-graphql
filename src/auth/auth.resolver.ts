import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { UseGuards } from '@nestjs/common';

import { CreateOTPByEmail, vCreateOTPByEmail } from './dto/createOTPByEmail';
import { RegisterUserDTO, vRegisterUserDto } from './dto/registerUserDto';
import { JoiValidatorPipe } from '../utils/validator/validator.pipe';
import { CommonResponse } from '../app/interface/graphql.interface';
import { LoginUserDTO, vLoginUserDto } from './dto/loginUserDto';
import { SmailService } from '../providers/smail/smail.service';
import { RedisService } from '../utils/redis/redis.service';
import { CheckOTPKey, vCheckOTPKey } from './dto/checkOTP';
import { apiResponse } from '../app/interface/apiResponse';
import { UserService } from '../user/user.service';
import User from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { UserGuard } from './auth.guard';
import { config } from '../config';

@Resolver('Auth')
export class AuthResolver {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly smailService: SmailService,
        private readonly redisService: RedisService,
    ) {}

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

    @Mutation(() => Boolean)
    @UseGuards(UserGuard)
    async logoutUser(@Context('res') res: Response, @Context('req') req: Request) {
        // clear all token in database
        await this.authService.clearToken(req.user.id);

        res.cookie('re-token', '', { maxAge: -999 }).cookie('auth-token', '', { maxAge: -999 });
        return true;
    }

    //----------------------------------OTP authentication without guard-----------------------------------------------------------
    @Mutation(() => CommonResponse)
    async createOTPByMail(
        @Context('req') req: Request,
        @Args('input', new JoiValidatorPipe(vCreateOTPByEmail)) body: CreateOTPByEmail,
    ): Promise<CommonResponse> {
        //checking amount of time which user request before by ip

        const userIp = this.authService.parseIp(req);
        let canSendMore = await this.authService.isRateLimitKey(
            userIp,
            config.authController.OTPMailLimitTime * 2,
            config.authController.OTPMailBlockTime,
        );
        if (!canSendMore) throw apiResponse.sendError(400, { errorMessage: { type: 'error.request-many-time', context: { time: '30' } } });

        //checking email is exist
        const user = await this.userService.findOneByField('email', body.email);
        if (!user) throw apiResponse.sendError(400, { email: { type: 'field.not-found' } });

        //checking amount of time which user request before by email
        canSendMore = await this.authService.isRateLimitKey(
            user.email,
            config.authController.OTPMailLimitTime,
            config.authController.OTPMailBlockTime,
        );
        if (!canSendMore) throw apiResponse.sendError(400, { errorMessage: { type: 'error.request-many-time', context: { time: '30' } } });

        //generate otp key
        const redisKey = await this.authService.createOTP(user, config.authController.OTPMailValidTime, 'email');
        const isSent = await this.smailService.sendOTP(user.email, redisKey);
        if (!isSent) throw apiResponse.sendError(500, { errorMessage: { type: 'error.some-wrong' } });
        const response = apiResponse.send(null, { message: { type: 'message.send-email' } });

        return {
            details: response.details,
        };
    }
    @Mutation(() => Boolean)
    async checkOTPKey(@Context('req') req: Request, @Args('input', new JoiValidatorPipe(vCheckOTPKey)) body: CheckOTPKey): Promise<boolean> {
        //checking otp is exist
        const isExist = await this.redisService.getObjectByKey<User>(body.key);
        if (!isExist) throw apiResponse.sendError(403, { errorMessage: { type: 'error.not-allow-action' } });

        return true;
    }
}
