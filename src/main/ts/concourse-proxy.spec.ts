import {ConcourseProxy} from "./concourse-proxy";
import {ParsedConcourseRequest} from "./concourse-request-parser";
import {ConcourseResponseParser, ParsedConcourseResponse} from "./concourse-response-parser";
import {CredentialRepository2} from "./credential-repository2";
import {Request} from 'express';
import * as nock from "nock";

const mockConcourseUrl = 'http://concourse.example.com';
const mockTeam = 'mock-team';

describe('ConcourseProxy', () => {
    let unitUnderTest: ConcourseProxy;
    let credentialRepository2: CredentialRepository2;
    let mockRequest: ParsedConcourseRequest;
    beforeEach(() => {
        credentialRepository2 = new CredentialRepository2(undefined);
        unitUnderTest = new ConcourseProxy(credentialRepository2);
        mockRequest = new ParsedConcourseRequest(undefined, mockConcourseUrl, mockTeam, undefined);
        mockRequest.request = jasmine.createSpyObj<Request>('Request', ['url']);
    });
    afterEach(() => {
        nock.cleanAll();
    });
    describe('proxyRequest',  () => {
        it('calls CredentialRepository2.loadAtcToken with the details found in the request', async () => {
            // stub
            nock(mockConcourseUrl)
                .get('/')
                .reply(200, 'OK');

            // spy
            spyOn(credentialRepository2, 'loadAtcToken')
                .and.returnValue(Promise.resolve(undefined));

            // given
            mockRequest.request = jasmine.createSpyObj<Request>('Request', ['url']);
            mockRequest.request.url = '/';

            // when
            await unitUnderTest.proxyRequest(mockRequest);

            // then
            expect(credentialRepository2.loadAtcToken).toHaveBeenCalledWith(mockConcourseUrl, mockTeam);
        });
        it('forwards the GET request', async () => {
            const expectedPath = '/api/v1/user';

            // stub
            const context = nock(mockConcourseUrl)
                .get(expectedPath)
                .reply(200, 'OK');
            spyOn(credentialRepository2, 'loadAtcToken')
                .and.returnValue(Promise.resolve(undefined));

            // given
            mockRequest.request = jasmine.createSpyObj<Request>('Request', ['url']);
            mockRequest.request.url = expectedPath;

            // when
            await unitUnderTest.proxyRequest(mockRequest);

            // then
            expect(context.isDone()).toBeTruthy();
        });
        it('forwards the Authorization HTTP header value if the original request contained one', async () => {
            const expectedPath = `/api/v1/teams/${mockTeam}/auth/token`;
            const validCredentials = 'Basic dXNlcjpwYXNzd29yZA==';

            const scope = nock(mockConcourseUrl, {
                reqheaders: {
                    'authorization': validCredentials
                }
            })
                .get(expectedPath)
                .reply(200, 'OK');
            spyOn(credentialRepository2, 'loadAtcToken')
                .and.returnValue(Promise.resolve(undefined));

            // given
            mockRequest.authorizationHeaderValue = validCredentials;
            mockRequest.request.url = expectedPath;
            mockRequest.request.headers = {
                'authorization': validCredentials
            };

            // when
            await unitUnderTest.proxyRequest(mockRequest);

            // then
            expect(scope.isDone()).toBeTruthy();
        });
        it('sets the ATC-Authorization Cookie if an ATC token was found in the CredentialRepository2', async () => {
            const expectedPath = `/api/v1/teams/${mockTeam}/pipelines`;
            const validToken = 'Bearer token';

            const expectedHeaders = { 'Cookie': `ATC-Authorization="${validToken}"` };
            const scope = nock(mockConcourseUrl, {reqheaders: expectedHeaders})
                .get(expectedPath)
                .reply(200, 'OK');

            spyOn(credentialRepository2, 'loadAtcToken')
                .and.returnValue(Promise.resolve(validToken));

            mockRequest.request.url = expectedPath;
            mockRequest.request.headers = {'x-concourse-url': mockConcourseUrl};

            await unitUnderTest.proxyRequest(mockRequest);

            expect(scope.isDone()).toBeTruthy();
        });
        it('calls ConcourseResponseParse.parseConcourseResponse with the response of Concourse', async () => {
            const expectedPath = `/api/v1/teams/${mockTeam}/pipelines`;

            nock(mockConcourseUrl)
                .get(expectedPath)
                .reply(200, 'OK');

            mockRequest.request.url = expectedPath;
            mockRequest.request.headers = {'x-concourse-url': mockConcourseUrl};

            spyOn(ConcourseResponseParser, 'parseConcourseResponse')
                .and.returnValue(Promise.resolve(new ParsedConcourseResponse(undefined)));

            await unitUnderTest.proxyRequest(mockRequest);

            expect(ConcourseResponseParser.parseConcourseResponse).toHaveBeenCalled();
        });
        it('saves the ATC bearer token if one was found in the Concourse response', async () => {
            const expectedPath = `/api/v1/teams/${mockTeam}/pipelines`;
            const expectedToken = 'Bearer TODO JWT ME';
            nock(mockConcourseUrl)
                .get(expectedPath)
                .reply(200, 'OK', {
                    'Set-Cookie': `ATC-Authorization="${expectedToken}"`
                });
            spyOn(credentialRepository2, 'saveAtcToken')
                .and.returnValue(Promise.resolve());

            const parsedConcourseResponse = new ParsedConcourseResponse(undefined);
            parsedConcourseResponse.atcToken = expectedToken;
            spyOn(ConcourseResponseParser, 'parseConcourseResponse')
                .and.returnValue(Promise.resolve(parsedConcourseResponse));

            mockRequest.request.url = expectedPath;
            mockRequest.request.headers = {'x-concourse-url': mockConcourseUrl};

            await unitUnderTest.proxyRequest(mockRequest);

            expect(credentialRepository2.saveAtcToken).toHaveBeenCalledWith(mockConcourseUrl, mockTeam, expectedToken);
        });
        describe('on path /api/v1/pipelines', () => {
            it('calls the URL with all known credentials for that Concourse URL', async () => {
                const expectedTeam1 = {team: 'team1', token: 'token 1'};
                const expectedTeam2 = {team: 'team2', token: 'token 2'};
                const expectedTeams = [expectedTeam1, expectedTeam2];
                spyOn(credentialRepository2, 'loadAllAtcTokens')
                    .and.returnValue(Promise.resolve(expectedTeams));

                mockRequest.request.url = '/api/v1/pipelines';
                const scope = nock(mockConcourseUrl);
                expectedTeams.forEach(team =>
                    scope.get(mockRequest.request.url, undefined, {reqheaders: {'Cookie':`ATC-Authorization="${team.token}"`}})
                        .reply(200, []));

                scope.get(mockRequest.request.url)
                    .reply(200, []);

                await unitUnderTest.proxyRequest(mockRequest);

                expect(scope.isDone()).toBeTruthy();
            });
            it('merges the responses into a single set', async () => {
                const expectedTeam1 = {team: 'team1', token: 'token 1', response: [{id:'a'},{id:'b'}]};
                const expectedTeam2 = {team: 'team2', token: 'token 2', response: [{id:'a'},{id:'b'},{id:'c'},{id:'d'}]};
                const expectedTeams = [expectedTeam1, expectedTeam2];
                spyOn(credentialRepository2, 'loadAllAtcTokens')
                    .and.returnValue(Promise.resolve(expectedTeams));

                mockRequest.request.url = '/api/v1/pipelines';
                const scope = nock(mockConcourseUrl);
                expectedTeams.forEach(team =>
                    scope.get(mockRequest.request.url, undefined, {reqheaders: {'Cookie':`ATC-Authorization="${team.token}"`}})
                        .reply(200, team.response));

                scope.get(mockRequest.request.url)
                    .reply(200, []);

                const actualResponse = await unitUnderTest.proxyRequest(mockRequest);

                expectedTeams
                    .map(team => team.response)
                    .reduce((a,b) => a.concat(...b), [])
                    .forEach(x => {
                        const parsedBody = JSON.parse(actualResponse.response.body);
                        const count = parsedBody.filter(item => item.id === x.id).length;

                        expect(count).toEqual(1);
                    })
            });
        });
    });
});