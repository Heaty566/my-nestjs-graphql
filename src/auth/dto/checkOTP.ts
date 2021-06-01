import { Field, InputType } from '@nestjs/graphql';
import * as Joi from 'joi';

@InputType({ description: 'check otp is valid' })
export class CheckOTPKey {
    @Field()
    key: string;
}

export const vCheckOTPKey = Joi.object({
    key: Joi.string().required(),
});
