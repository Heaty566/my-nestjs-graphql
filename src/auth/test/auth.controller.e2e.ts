import { INestApplication } from '@nestjs/common';
import { LoginUserDTO } from '../dto/loginUserDto';
import * as supertest from 'supertest';
import { fakeUser } from '../../test/fakeEntity';

//---- Helper
import { initTestModule } from '../../test/initTest';
//---- Controller
//---- Repository
import { UserRepository } from '../../user/entities/user.repository';
import { ReTokenRepository } from '../entities/re-token.repository';

//---- Entity//---- Service
import { SmailService } from '../../providers/smail/smail.service';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import User from '../../user/entities/user.entity';
import { RegisterUserDTO } from '../dto/registerUserDto';
import { CreateOTPByEmail } from '../dto/createOTPByEmail';
import { fakeData } from '../../test/test.helper';

describe('AuthController', () => {
    let app: INestApplication;
    let userDB: User;

    let userRepository: UserRepository;

    let authService: AuthService;
    let userService: UserService;
    let mailService: SmailService;
    let reTokenRepository: ReTokenRepository;
    let resetDB: any;
    beforeAll(async () => {
        const { getApp, module, users, resetDatabase } = await initTestModule();
        app = getApp;
        userDB = (await users[0]).user;
        resetDB = resetDatabase;

        userRepository = module.get<UserRepository>(UserRepository);
        reTokenRepository = module.get<ReTokenRepository>(ReTokenRepository);
        authService = module.get<AuthService>(AuthService);
        mailService = module.get<SmailService>(SmailService);
        userService = module.get<UserService>(UserService);
    });

    describe('Common Authentication', () => {
        describe('loginUser', () => {
            let loginUserData: LoginUserDTO;

            const reqApi = (input: LoginUserDTO) =>
                supertest(app.getHttpServer())
                    .post('/api/graphql')
                    .send({ query: ` mutation {loginUser ( input: {username: "${input.username}" password: "${input.password}" })}` });
            beforeEach(async () => {
                const getUser = fakeUser();
                loginUserData = {
                    username: getUser.username,
                    password: getUser.password,
                };
                getUser.password = await authService.encryptString(getUser.password);
                await userService.save(getUser);
            });
            it('Pass', async () => {
                const res = await reqApi(loginUserData);

                const token = res.headers['set-cookie'].join('');
                expect(token).toContain('re-token');
            });
            it('Failed (username is not correct)', async () => {
                loginUserData.username = 'updateaaabbbccc';
                const res = await reqApi(loginUserData);

                expect(res.body.errors[0].extensions.status).toBe(400);
            });

            it('Failed (password is not correct)', async () => {
                loginUserData.password = '123AABBDASDaa';
                const res = await reqApi(loginUserData);
                expect(res.body.errors[0].extensions.status).toBe(400);
            });
        });
        describe('registerUser', () => {
            let createUserData: RegisterUserDTO;
            const reqApi = (input: RegisterUserDTO) =>
                supertest(app.getHttpServer())
                    .post('/api/graphql')
                    .send({
                        query: ` mutation {registerUser ( input: {username: "${input.username}" password: "${input.password}" confirmPassword: "${input.confirmPassword}" name: "${input.name}" })}`,
                    });

            beforeEach(() => {
                const getUser = fakeUser();
                createUserData = {
                    name: getUser.name,
                    username: getUser.username,
                    password: getUser.password,
                    confirmPassword: getUser.password,
                };
            });

            it('Pass', async () => {
                const res = await reqApi(createUserData);

                const token = res.headers['set-cookie'].join('');
                expect(token).toContain('re-token');
            });

            it('Failed (username is taken)', async () => {
                await reqApi(createUserData);
                const res = await reqApi(createUserData);
                expect(res.body.errors[0].extensions.status).toBe(400);
            });

            it('Failed (confirmPassword does not match)', async () => {
                createUserData.confirmPassword = '12345678';
                const res = await reqApi(createUserData);

                expect(res.body.errors[0].extensions.status).toBe(400);
            });
        });
        describe('POST /logout', () => {
            let user: User;
            let reToken: string;
            const reqApi = (reToken: string) =>
                supertest(app.getHttpServer())
                    .post('/api/graphql')
                    .set({ cookie: `re-token=${reToken};` })
                    .send({
                        query: ` mutation { logoutUser }`,
                    });

            beforeEach(async () => {
                user = await userRepository.save(fakeUser());
                reToken = await authService.createReToken(user);
            });

            it('Pass', async () => {
                const res = await reqApi(reToken);
                const checkToken = await reTokenRepository.findOne({ where: { userId: user.id } });

                expect(checkToken).toBe(undefined);
                expect(res.status).toBe(200);
            });
        });
    });
    describe('OTP authentication without guard', () => {
        describe(' /otp-email', () => {
            let otpMail: CreateOTPByEmail;
            const reqApi = (input: CreateOTPByEmail) =>
                supertest(app.getHttpServer())
                    .post('/api/graphql')
                    .send({
                        query: ` mutation { createOTPByMail ( input: { email: "${input.email}" }){details}}`,
                    });

            beforeEach(() => {
                otpMail = {
                    email: userDB.email,
                };
            });

            it('Pass', async () => {
                const mySpy = jest.spyOn(authService, 'isRateLimitKey').mockImplementation(() => Promise.resolve(true));

                const res = await reqApi(otpMail);

                expect(res.status).toBe(200);
                expect(res.body.data.createOTPByMail.details).toBeDefined();

                mySpy.mockClear();
            });

            it('Failed (error of smail)', async () => {
                const mySpy = jest.spyOn(mailService, 'sendOTP').mockImplementation(() => Promise.resolve(false));

                const res = await reqApi(otpMail);

                expect(res.body.errors[0].extensions.status).toBe(500);

                mySpy.mockClear();
            });

            it('Failed (spam ip)', async () => {
                const mySpy = jest.spyOn(authService, 'isRateLimitKey').mockImplementation(() => Promise.resolve(false));

                const res = await reqApi(otpMail);

                expect(res.body.errors[0].extensions.status).toBe(400);

                mySpy.mockClear();
            });

            it('Failed (spam email)', async () => {
                const mySpy = jest
                    .spyOn(authService, 'isRateLimitKey')
                    .mockImplementation(jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false));

                const res = await reqApi(otpMail);

                expect(res.body.errors[0].extensions.status).toBe(400);

                mySpy.mockClear();
            });

            it('Failed (email does not exist)', async () => {
                const mySpy = jest.spyOn(authService, 'isRateLimitKey').mockImplementation(() => Promise.resolve(true));

                otpMail = {
                    email: fakeData(10, 'lettersLowerCase') + '@gmail.com',
                };
                const res = await reqApi(otpMail);
                expect(res.body.errors[0].extensions.status).toBe(400);

                mySpy.mockClear();
            });
        });

        describe('/check-otp', () => {
            const reqApi = (input: string) =>
                supertest(app.getHttpServer())
                    .post('/api/graphql')
                    .send({
                        query: ` mutation { checkOTPKey ( input: { key: "${input}" })}`,
                    });
            it('Pass', async () => {
                const otp = await authService.createOTP(userDB, 10, 'email');
                const res = await reqApi(otp);

                expect(res.body.data.checkOTPKey).toBeTruthy();
            });

            it('Failed (otp does not exist)', async () => {
                const res = await reqApi('123456789');

                expect(res.body.errors[0].extensions.status).toBe(403);
            });
        });
    });

    afterAll(async () => {
        await resetDB();
        await app.close();
    });
});
