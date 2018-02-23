import {ExpressApp} from "./express-app";
import {HealthEndpoint} from "./health-endpoint";
import {CredentialService} from "./credential-service";
import {ConcourseProxy} from "./concourse-proxy";
import {ConcourseEndpoint2} from "./concourse-endpoint2";
import any = jasmine.any;

describe('ExpressApp', () => {

    let unitUnderTest: ExpressApp;
    let credentialRepository2: CredentialService;
    let concourseProxy: ConcourseProxy;
    let concourseEndpoint2: ConcourseEndpoint2;
    let healthEndpoint: HealthEndpoint;
    let port: number;
    beforeEach(() => {
        credentialRepository2 = jasmine.createSpyObj<CredentialService>('CredentialService', ['load']);
        (credentialRepository2.load as jasmine.Spy).and.returnValue(Promise.resolve());

        concourseProxy = jasmine.createSpyObj<ConcourseProxy>('ConcourseProxy', ['proxyRequest']);
        concourseEndpoint2 = jasmine.createSpyObj<ConcourseEndpoint2>('ConcourseEndpoint2', ['handleRequest']);
        healthEndpoint = jasmine.createSpyObj<HealthEndpoint>('HealthEndpoint', ['nothing']);
        port = 12345;

        unitUnderTest = new ExpressApp(credentialRepository2, concourseProxy, concourseEndpoint2, healthEndpoint, port);
        spyOn((unitUnderTest as any).app, 'use').and.stub();
        spyOn((unitUnderTest as any).app, 'listen')
            .and.callFake((port,cb)=>cb());
    });
    describe('start', () => {
        it('calls .load() on the CredentialService instance', async () => {
            expect(credentialRepository2.load).toHaveBeenCalledTimes(0);
            await unitUnderTest.start();
            expect(credentialRepository2.load).toHaveBeenCalledTimes(1);
        });
        it('rejects the Promise if the .load() call fails', async () => {
            const expectedReason = 'expected rejection';
            (credentialRepository2.load as jasmine.Spy).and.returnValue(Promise.reject(expectedReason));

            await unitUnderTest.start()
                .then(() => fail())
                .catch(e => expect(e).toEqual(expectedReason));
        });
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
        it('makes the express app listen on the given TCP port', async () => {
            await unitUnderTest.start();
            expect((unitUnderTest as any).app.listen)
                .toHaveBeenCalledWith(port, any(Function));
        });
    });
});
