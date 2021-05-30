import { Injectable, PipeTransform } from '@nestjs/common';
import { ObjectSchema } from 'joi';
import { UserInputError } from 'apollo-server-express';

//---- Service
import { LocalesService } from '../locales/locales.service';

//---- Common
import { apiResponse } from '../../app/interface/apiResponse';

@Injectable()
export class JoiValidatorPipe implements PipeTransform {
    constructor(private readonly schema: ObjectSchema) {}

    transform(input: any) {
        if (!input) throw apiResponse.sendError(400, { message: { type: 'error.invalid-input' } });
        const { error, value } = this.schema.validate(input, { abortEarly: false });
        if (error) throw apiResponse.sendError(400, { ...LocalesService.mapJoiError(error) });

        return value;
    }
}
