import { ExceptionFilter, Catch, HttpException } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';

//* Internal import

@Catch(UserInputError)
export class GraphqlHandler implements ExceptionFilter {
    catch(exception: HttpException) {
        if (process.env.NODE_ENV === 'development') {
            console.log(exception);
        }
        return exception;
    }
}
