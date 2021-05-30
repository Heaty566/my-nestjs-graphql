import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

//---- Service

import { AuthService } from './auth.service';

import { config } from '../config';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    //---------------------------------- 3rd authentication -----------------------------------------------------------
    @Get('/google')
    @UseGuards(AuthGuard('google'))
    cGoogleAuth() {
        //
    }

    @Get('/google/callback')
    @UseGuards(AuthGuard('google'))
    async cGoogleAuthRedirect(@Req() req: Request, @Res() res: Response) {
        const reToken = await this.authService.createReToken(req.user);
        return res.cookie('re-token', reToken, { maxAge: config.authController.googleUserCookieTime }).redirect(process.env.CLIENT_URL);
    }

    @Get('/facebook')
    @UseGuards(AuthGuard('facebook'))
    cFacebookAuth() {
        //
    }

    @Get('/facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    async cFacebookAuthRedirect(@Req() req: Request, @Res() res: Response) {
        const reToken = await this.authService.createReToken(req.user);
        return res.cookie('re-token', reToken, { maxAge: config.authController.facebookUserCookieTime }).redirect(process.env.CLIENT_URL);
    }

    @Get('/github')
    @UseGuards(AuthGuard('github'))
    async cGithubAuth() {
        //
    }

    @Get('/github/callback')
    @UseGuards(AuthGuard('github'))
    async cGithubAuthRedirect(@Req() req: Request, @Res() res: Response) {
        const reToken = await this.authService.createReToken(req.user);
        return res.cookie('re-token', reToken, { maxAge: config.authController.githubUserCookieTime }).redirect(process.env.CLIENT_URL);
    }
}
