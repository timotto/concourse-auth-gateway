import * as express from "express";
import * as bodyParser from 'body-parser';
import {JsonLogger} from "./json-logger";
import {ExpressApp} from "./express-app";

const app = express();
app.use(bodyParser.json());

new ExpressApp(app);

app.listen(app.get("port"), () =>
    JsonLogger.log('online', {
        port: app.get("port"),
        env: app.get("env")}));
