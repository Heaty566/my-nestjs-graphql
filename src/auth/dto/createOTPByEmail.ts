import { Field, InputType } from '@nestjs/graphql';
import * as Joi from 'joi';
import User from '../../user/entities/user.entity';
import { userJoiSchema } from '../../utils/validator/schema/user.validator';
import { ValidatorService } from '../../utils/validator/validator.service';

const { getJoiSchemas } = ValidatorService.joiSchemaGenerator<User>(userJoiSchema);

@InputType({ description: 'create new otp key by email' })
export class CreateOTPByEmail {
    @Field()
    email: string;
}

export const vCreateOTPByEmail = Joi.object({
    ...getJoiSchemas(['email']),
});
