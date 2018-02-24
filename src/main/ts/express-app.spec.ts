import {ExpressApp} from "./express-app";
import {HealthEndpoint} from "./health-endpoint";
import {CredentialService} from "./credential-service";
import {ConcourseProxy} from "./concourse-proxy";
import {ConcourseEndpoint2} from "./concourse-endpoint2";
import any = jasmine.any;
import {CredentialEndpoint} from "./credential-endpoint";

describe('ExpressApp', () => {

    let unitUnderTest: ExpressApp;
    let credentialRepository2: CredentialService;
    let concourseProxy: ConcourseProxy;
    let concourseEndpoint2: ConcourseEndpoint2;
    let healthEndpoint: HealthEndpoint;
    let credentialsEndpoint: CredentialEndpoint;
    let port: number;
    beforeEach(() => {
        credentialRepository2 = jasmine.createSpyObj<CredentialService>('CredentialService', ['nothing']);

        concourseProxy = jasmine.createSpyObj<ConcourseProxy>('ConcourseProxy', ['proxyRequest']);
        concourseEndpoint2 = jasmine.createSpyObj<ConcourseEndpoint2>('ConcourseEndpoint2', ['handleRequest']);
        healthEndpoint = jasmine.createSpyObj<HealthEndpoint>('HealthEndpoint', ['nothing']);
        credentialsEndpoint = jasmine.createSpyObj<CredentialEndpoint>('CredentialEndpoint', ['nothing']);
        port = 12345;

        unitUnderTest = new ExpressApp(credentialRepository2, concourseProxy, concourseEndpoint2, healthEndpoint, credentialsEndpoint, port);
        spyOn((unitUnderTest as any).app, 'use').and.stub();
        spyOn((unitUnderTest as any).app, 'listen')
            .and.callFake((port,cb)=>cb());
    });
    describe('start', () => {
        it('registers the ConcourseEndpoint2 on /', async () => {
            await unitUnderTest.start();
            expect((unitUnderTest as any).app.use)
                .toHaveBeenCalledWith('/', concourseEndpoint2.router);
        });
        it('registers the HealthEndpoint on /healthz', async () => {
            await unitUnderTest.start();
            expect((unitUnderTest as any).app.use)
                .toHaveBeenCalledWith('/healthz', healthEndpoint.router);
        });
        it('registers the CredentialEndpoint on /_auth', async () => {
            await unitUnderTest.start();
            expect((unitUnderTest as any).app.use)
                .toHaveBeenCalledWith('/_auth', credentialsEndpoint.router);
        });
        it('makes the express app listen on the given TCP port', async () => {
            await unitUnderTest.start();
            expect((unitUnderTest as any).app.listen)
                .toHaveBeenCalledWith(port, any(Function));
        });
    });
});
