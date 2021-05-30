import { Dictionary } from '../../utils/locales/locales.service';
import * as i18n from 'i18n';

type ResponseDetailItem = { type: Dictionary; context?: i18n.Replacements };

export interface BodyDetailsLocate {
    message?: ResponseDetailItem;
    errorMessage?: ResponseDetailItem;
    [key: string]: ResponseDetailItem;
}

export class BodyDetails {
    message?: string;
    errorMessage?: string;
    [key: string]: string;
}
