import { Field, InputType } from '@nestjs/graphql';
import * as Joi from 'joi';
import User from '../../user/entities/user.entity';
import { userJoiSchema } from '../../utils/validator/schema/user.validator';
import { ValidatorService } from '../../utils/validator/validator.service';

const { getJoiSchemas } = ValidatorService.joiSchemaGenerator<User>(userJoiSchema);

@InputType({ description: 'login user' })
export class LoginUserDTO {
    @Field()
    username: string;

    @Field()
    password: string;
}

export const vLoginUserDto = Joi.object({
    ...getJoiSchemas(['username', 'password']),
});
