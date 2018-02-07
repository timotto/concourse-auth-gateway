import * as express from 'express';
import {ExpressApp} from "./express-app";
import {HealthEndpoint} from "./health-endpoint";

describe('ExpressApp', () => {

    it('sets the "port" property to 3001 by default', () => {
        delete process.env.PORT;
        const app = express();
        spyOn(app, 'set').and.stub();
        new ExpressApp(app);
        expect(app.set).toHaveBeenCalledWith('port', 3001);
    });

    it('sets the "port" property to value of the PORT environment variable if defined', () => {
        process.env.PORT = (Math.random() * 65535).toString();
        const app = express();
        spyOn(app, 'set').and.stub();
        new ExpressApp(app);
        expect(app.set).toHaveBeenCalledWith('port', process.env.PORT);
    });

    it('registers the HealthEndpoint on /healthz', () => {
        const app = express();
        const spy = spyOn(ExpressApp.prototype, 'registerEndpoint').and.stub();
        new ExpressApp(app);
        expect(spy).toHaveBeenCalledWith('/healthz', HealthEndpoint);
    });
});
