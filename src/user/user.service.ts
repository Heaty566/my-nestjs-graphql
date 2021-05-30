import { Injectable } from '@nestjs/common';
import User from './entities/user.entity';
import { UserRepository } from './entities/user.repository';

@Injectable()
export class UserService {
    constructor(private userRepository: UserRepository) {}
    async findOneByField(field: keyof User, value: any) {
        return await this.userRepository.findOneByField(field, value);
    }
    async save(input: User): Promise<User> {
        return await this.userRepository.save(input);
    }
}
