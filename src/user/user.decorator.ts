import { SetMetadata } from '@nestjs/common';

//---- Entity
import { UserRole } from './entities/user.interface';

export const Roles = (role: UserRole) => SetMetadata('role', role);
