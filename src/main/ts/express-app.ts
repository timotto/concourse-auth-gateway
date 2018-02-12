import {Service, Inject} from "typedi";
import * as express from 'express';
import * as bodyParser from 'body-parser';
import {Express} from 'express';
import {HealthEndpoint} from "./health-endpoint";
import {ConcourseEndpoint2} from "./concourse-endpoint2";
import {CredentialRepository2} from "./credential-repository2";
import {ConcourseProxy} from "./concourse-proxy";

@Service()
export class ExpressApp {

    private app: Express = express();

    constructor(private credentialRepository2: CredentialRepository2,
                private concourseProxy: ConcourseProxy,
                private concourseEndpoint2: ConcourseEndpoint2,
                private healthEndpoint: HealthEndpoint,
                @Inject('port') private port: number) {
    }

    public start(): Promise<void> {
        return this.credentialRepository2
            .load()
            .then(() => this.useApp())
            .then(() => this.listen());
    }

    private useApp(): Promise<void> {
        this.app.use(bodyParser.json());
        this.app.use("/healthz", this.healthEndpoint.router);
        this.app.use("/", this.concourseEndpoint2.router);

        return Promise.resolve();
    }

    private listen(): Promise<void> {
        return new Promise<void>((resolve => this.app.listen(this.port, () => resolve())));
    }
}