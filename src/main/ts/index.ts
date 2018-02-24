import {Container} from "typedi";
import "reflect-metadata";
import {ExpressApp} from "./express-app";
import {JsonLogger} from "./json-logger";

Container.set('port', parseInt(process.env.PORT || '3001'));
Container.set('secret', process.env.SECRET || 'changeme');
Container.set('redisUrl', process.env.REDIS_URL || undefined);

Container
    .get(ExpressApp)
    .start()
    .catch(error => JsonLogger.log('error', error));
