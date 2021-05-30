import { Field, InputType } from '@nestjs/graphql';
import * as Joi from 'joi';
import User from '../../user/entities/user.entity';
import { userJoiSchema } from '../../utils/validator/schema/user.validator';
import { ValidatorService } from '../../utils/validator/validator.service';

const { getJoiSchema, getJoiSchemas } = ValidatorService.joiSchemaGenerator<User>(userJoiSchema);

@InputType({ description: 'register new user' })
export class RegisterUserDTO {
    @Field()
    username: string;

    @Field()
    name: string;

    @Field()
    password: string;

    @Field()
    confirmPassword: string;
}

export const vRegisterUserDto = Joi.object({
    ...getJoiSchemas(['username', 'password', 'name']),
    confirmPassword: getJoiSchema('password').valid(Joi.ref('password')),
});
