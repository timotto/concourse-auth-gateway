import {Container} from "typedi";
import "reflect-metadata";
import {ExpressApp} from "./express-app";
import {JsonLogger} from "./json-logger";

Container.set('port', parseInt(process.env.PORT || '3001'));
Container.set('stateFilename', process.env.STATE_FILENAME || 'credentials.json');
Container.set('secret', process.env.SECRET || 'not so very secret');
Container.set('redisUrl', process.env.REDIS_URL || undefined);

Container
    .get(ExpressApp)
    .start()
    .catch(error => JsonLogger.log('error', error));
