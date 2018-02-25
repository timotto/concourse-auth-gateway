import {Container} from "typedi";
import "reflect-metadata";
import {ExpressApp} from "./express-app";
import {JsonLogger} from "./json-logger";

Container.set('port', parseInt(process.env.PORT || '3001'));
Container.set('secret', process.env.SECRET || 'changeme');
Container.set('salt', process.env.SALT || 'changeme');
Container.set('iterations', parseInt(process.env.ITERATIONS || '100000'));
Container.set('digest', process.env.DIGEST || 'sha512');
Container.set('redisUrl', process.env.REDIS_URL || '');

Container
    .get(ExpressApp)
    .start()
    .catch(error => JsonLogger.log('error', error));
