import { UserInputError } from 'apollo-server-express';
import { LocalesService } from '../../utils/locales/locales.service';
import { BodyDetailsLocate } from './api.interface';

class ApiResponse {
    constructor(private readonly localeService: LocalesService) {}

    /**
     *
     * @description allow translate message before send back to client
     */
    public send<T>(data: T, details: BodyDetailsLocate) {
        const detailsFormat = this.localeService.translateDetails(details);

        return { details: JSON.stringify(detailsFormat), data };
    }

    /**
     *
     * @description allow translate message before send back to client
     */
    public sendError(code: number, details: BodyDetailsLocate) {
        const detailsFormat = this.localeService.translateDetails(details);
        throw new UserInputError('error', { statusCode: code, details: detailsFormat });
    }
}

export const apiResponse = new ApiResponse(new LocalesService());
