import {Service, Inject} from "typedi";
import * as express from 'express';
import * as bodyParser from 'body-parser';
import {Express} from 'express';
import {HealthEndpoint} from "./health-endpoint";
import {ConcourseEndpoint2} from "./concourse-endpoint2";
import {CredentialEndpoint} from "./credential-endpoint";
import {CredentialRepository} from "./credential-repository";

@Service()
export class ExpressApp {

    private app: Express = express();

    constructor(private credentialRepository: CredentialRepository,
                private concourseEndpoint2: ConcourseEndpoint2,
                private healthEndpoint: HealthEndpoint,
                private credentialEndpoint: CredentialEndpoint,
                @Inject('port') private port: number) {
    }

    public start(): Promise<void> {
        this.useApp();
        return this.credentialRepository.start()
            .then(() => this.listen());
    }

    private useApp() {
        this.app.use(bodyParser.json());
        this.app.use("/healthz", this.healthEndpoint.router);
        this.app.use("/_auth", this.credentialEndpoint.router);
        this.app.use("/", this.concourseEndpoint2.router);
    }

    private listen(): Promise<void> {
        return new Promise<void>((resolve => this.app.listen(this.port, () => resolve())));
    }
}