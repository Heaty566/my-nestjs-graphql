import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('user')
export class UserSchema {
    @Field(() => String)
    id: string;

    @Field(() => String)
    username: string;

    @Field(() => String, { defaultValue: '' })
    name: string;

    @Field(() => String)
    avatarUrl: string;

    @Field(() => String, { defaultValue: '', nullable: true })
    phone: string;

    @Field(() => String)
    email: string;

    @Field(() => Date)
    createDate: Date;
}
