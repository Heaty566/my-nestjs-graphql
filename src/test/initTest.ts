import { Test, TestingModule } from '@nestjs/testing';

//* Internal import
import { router } from '../router';
import { AppModule } from '../app.module';
import { fakeUser } from './fakeEntity';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../user/entities/user.interface';

//---- Repository
import { UserRepository } from '../user/entities/user.repository';
import { ReTokenRepository } from '../auth/entities/re-token.repository';

export const initUsers = async (repository: UserRepository, authService: AuthService) => {
    return Array.from(Array(5)).map(async () => {
        const dummyUser = fakeUser();

        const user = await repository.save(dummyUser);
        const reToken = await authService.createReToken(user);
        const ioToken = await authService.getSocketToken(user);

        return {
            user,
            reToken,
            ioToken,
        };
    });
};

const resetDatabase = async (module: TestingModule) => {
    const userRepository = module.get<UserRepository>(UserRepository);
    const reTokenRepository = module.get<ReTokenRepository>(ReTokenRepository);

    await reTokenRepository.createQueryBuilder().delete().execute();
    await reTokenRepository.clear();

    await userRepository.createQueryBuilder().delete().execute();
    await userRepository.clear();
};

export const initTestModule = async () => {
    const module: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const configModule = module.createNestApplication();
    //apply middleware
    router(configModule);
    const getApp = await configModule.init();

    //create a fake user and token
    const userRepository = module.get<UserRepository>(UserRepository);
    const authService = module.get<AuthService>(AuthService);
    const users = await initUsers(userRepository, authService);

    // create a fake admin
    let adminUser = fakeUser();
    adminUser.role = UserRole.ADMIN;
    adminUser = await userRepository.save(adminUser);
    const adminReToken = await authService.createReToken(adminUser);

    return {
        getApp,
        module,
        configModule,
        users,
        resetDatabase: async () => await resetDatabase(module),
        getFakeUser: async () => await userRepository.save(fakeUser()),
        getAdmin: {
            user: adminUser,
            reToken: adminReToken,
        },
    };
};
