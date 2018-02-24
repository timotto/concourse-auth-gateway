import {CredentialEndpoint} from "./credential-endpoint";
import {CredentialService} from "./credential-service";
import * as express from 'express';
import * as bodyParser from 'body-parser'
import * as request from 'supertest';

describe('Credential Endpoint', () => {
    let unitUnderTest: CredentialEndpoint;
    let mockCredentialService: CredentialService;
    let mockApp;
    beforeEach(() => {
        mockCredentialService = jasmine.createSpyObj<CredentialService>(
            'CredentialService', [
                'saveAtcToken', 'saveAuthenticationCredentials', 'requestAtcToken']);
        (mockCredentialService.saveAtcToken as jasmine.Spy)
            .and.returnValue(Promise.resolve());
        (mockCredentialService.saveAuthenticationCredentials as jasmine.Spy)
            .and.returnValue(Promise.resolve());
        (mockCredentialService.requestAtcToken as jasmine.Spy)
            .and.returnValue(Promise.resolve('token'));

        unitUnderTest = new CredentialEndpoint(mockCredentialService);
        mockApp = express();
        mockApp.use(bodyParser.json());
        mockApp.use('/', unitUnderTest.router);
    });
    describe('POST request on /token', () => {
        it('saves the token using the CredentialService', async () => {
            // given
            const givenConcourseUrl = 'concourse-url';
            const givenTeamName = 'team-name';
            const givenToken = 'Bearer TODO';
            const givenRequestBody = {
                concourseUrl: givenConcourseUrl,
                team: givenTeamName,
                token: givenToken
            };

            // when
            await request(mockApp)
                .post('/token')
                .send(givenRequestBody)
                .expect(200);

            // then
            expect(mockCredentialService.saveAtcToken)
                .toHaveBeenCalledWith(givenConcourseUrl, givenTeamName, givenToken);
        });
    });
    describe('POST request on /basic', () => {
        it('saves the team credentials using the CredentialService', async () => {
            // given
            const givenConcourseUrl = 'concourse-url';
            const givenTeamName = 'team-name';
            const givenCredentials = 'Basic TODO';
            const givenRequestBody = {
                concourseUrl: givenConcourseUrl,
                team: givenTeamName,
                credentials: givenCredentials
            };

            // when
            await request(mockApp)
                .post('/basic')
                .send(givenRequestBody)
                .expect(200);

            // then
            expect(mockCredentialService.saveAuthenticationCredentials)
                .toHaveBeenCalledWith(givenConcourseUrl, givenTeamName, givenCredentials);
        });
        it('does not save the team credentials an ATC bearer token cannot be obtained using the credentials', async () => {
            // given
            (mockCredentialService.requestAtcToken as jasmine.Spy)
                .and.returnValue(Promise.resolve(undefined));

            const givenConcourseUrl = 'concourse-url';
            const givenTeamName = 'team-name';
            const givenCredentials = 'Basic TODO';
            const givenRequestBody = {
                concourseUrl: givenConcourseUrl,
                team: givenTeamName,
                credentials: givenCredentials
            };

            // when
            await request(mockApp)
                .post('/basic')
                .send(givenRequestBody)
                .expect(403);

            // then
            expect(mockCredentialService.requestAtcToken)
                .toHaveBeenCalledWith(givenConcourseUrl, givenTeamName, givenCredentials);
        });

    });
});