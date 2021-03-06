import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

//---- Service
import { AuthService } from './auth.service';

//---- Entity
import { UserRole } from '../user/entities/user.interface';

//---- Common
import { apiResponse } from '../app/interface/apiResponse';

@Injectable()
export class UserGuard implements CanActivate {
    constructor(private authService: AuthService, private readonly reflector: Reflector) {}

    private async deleteAllAuthToken(res: Response) {
        res.cookie('auth-token', '', { maxAge: -999 });
        res.cookie('re-token', '', { maxAge: -999 });
        res.cookie('io-token', '', { maxAge: -999 });
    }

    private async getAuthToken(res: Response, reToken: string) {
        const authTokenId = await this.authService.getAuthTokenByReToken(reToken);
        if (!authTokenId) {
            this.deleteAllAuthToken(res);
            throw apiResponse.sendError(403, {});
        }
        res.cookie('auth-token', authTokenId, { maxAge: 1000 * 60 * 5 });
        return await this.authService.getUserByAuthToken(authTokenId);
    }

    async canActivate(context: ExecutionContext) {
        const { req, res } = GqlExecutionContext.create(context).getContext<{ req: Request; res: Response }>();
        const role = this.reflector.get<UserRole>('role', context.getHandler());

        // get refreshToken and authToken
        const refreshToken = req.cookies['re-token'] || '';
        const authToken = req.cookies['auth-token'] || '';

        //checking re-token
        if (!refreshToken) {
            res.cookie('re-token', '', { maxAge: 0 });
            throw apiResponse.sendError(403, {});
        }

        //checking auth-token
        if (authToken) {
            const user = await this.authService.getUserByAuthToken(authToken);
            if (!user) req.user = await this.getAuthToken(res, refreshToken);
            else req.user = user;
        } else req.user = await this.getAuthToken(res, refreshToken);
        //checking isDisabled user
        if (req.user.isDisabled) {
            this.deleteAllAuthToken(res);
            throw apiResponse.sendError(403, { errorMessage: { type: 'error.user-banned' } });
        }

        //checking role
        if (role === UserRole.ADMIN && req.user.role !== UserRole.ADMIN) {
            this.deleteAllAuthToken(res);
            throw apiResponse.sendError(403, { errorMessage: { type: 'error.not-allow-action' } });
        }

        return true;
    }
}
