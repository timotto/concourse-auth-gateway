import {Router} from "express";
import {HealthEndpoint} from "./health-endpoint";
import {ConcourseEndpoint2} from "./concourse-endpoint2";
import {CredentialRepository2} from "./credential-repository2";
import {ConcourseProxy} from "./concourse-proxy";
import {JsonLogger} from "./json-logger";

export class ExpressApp {
    constructor(readonly app, private router: () => Router) {
        app.set("port", process.env.PORT || 3001);
        this.registerEndpoint('/healthz', HealthEndpoint);

        const stateFilename = process.env.STATE_FILENAME || 'credentials.json';
        const credentialRepository2 = new CredentialRepository2(stateFilename);
        const concourseProxy = new ConcourseProxy(credentialRepository2);
        const concourseEndpoint2 = new ConcourseEndpoint2(
            credentialRepository2,
            concourseProxy,
            this.router());

        credentialRepository2.load().catch(error => JsonLogger.log('error', error));

        app.use("/", concourseEndpoint2.router);
    }

    public registerEndpoint(path, endpoint) {
        this.app.use(path, new endpoint(this.router()).router);
    }

}