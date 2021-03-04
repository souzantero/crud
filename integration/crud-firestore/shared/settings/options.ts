import configuration from './configuration';
import * as Joi from '@hapi/joi';
import { ConfigModuleOptions } from '@nestjs/config/dist/interfaces';

export const configOptions: ConfigModuleOptions = {
  envFilePath: './integration/crud-firestore/.env',
  load: [configuration],
  validationSchema: Joi.object({
    FIRESTORE_PROJECT_ID: Joi.string().required(),
    FIRESTORE_CLIENT_EMAIL: Joi.string().required(),
    FIRESTORE_PRIVATE_KEY: Joi.string().required()
  }),
}
