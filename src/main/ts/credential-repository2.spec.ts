import {CredentialRepository2} from "./credential-repository2";
import * as fs from 'fs';
import * as nock from 'nock';
import * as jwt from 'jsonwebtoken';

const testStateFilename = 'test-state.json';

const validConcourseUrl = 'http://concourse.example.com';
const validTeam = 'team1';
const validCredentials = 'Basic dXNlcjpwYXNzd29yZA==';
const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImV4cCI6MjUxNzkzODMzMH0.OIJNEHFnopeC4hfalB5Z12R8MUAXmj0py4hLDGn32B8';

const validConcourseUrl2 = 'https://different-concourse.example.com';
const validTeam2 = 'team2';
const validToken2 = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMzM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIDIiLCJhZG1pbiI6dHJ1ZSwiZXhwIjoyNTE3OTM4MzMwfQ.QAewWQ9kMhN6nHdy5D1c2sL4WTxM5rivHhGzv1UA5yg';

const invalidUrlValues = [undefined, null, '', 'not-a-url'];
const invalidTeamValues = [undefined, null, ''];
const invalidCredentialValues = [undefined, null, ''];
const invalidTokenValues = [undefined, null, ''];

describe('Credential Repository 2', () => {
    let unitUnderTest: CredentialRepository2;
    beforeEach(async () => {
        unitUnderTest = new CredentialRepository2(undefined);
        await unitUnderTest.load();
    });
    afterEach(done => {
        nock.cleanAll();
        fs.unlink(testStateFilename, () => done())
    });
    describe('saveAuthenticationCredentials', () => {
        it('rejects the promise if the URL is invalid', async () => {
            invalidUrlValues.forEach(async url => await unitUnderTest
                .saveAuthenticationCredentials(url, validTeam, validCredentials)
                .then(() => fail(`url value [${url}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
        it('rejects the promise if the team is invalid', async () => {
            invalidTeamValues.forEach(async team => await unitUnderTest
                .saveAuthenticationCredentials(validConcourseUrl, team, validCredentials)
                .then(() => fail(`team value [${team}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
        it('rejects the promise if the credential is invalid', async () => {
            invalidCredentialValues.forEach(async credential => await unitUnderTest
                .saveAuthenticationCredentials(validConcourseUrl, validTeam, credential)
                .then(() => fail(`credential value [${credential}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
    });
    describe('loadAuthenticationCredentials', () => {
        it('rejects the promise if the URL is invalid', async () => {
            invalidUrlValues.forEach(async url => await unitUnderTest
                .loadAuthenticationCredentials(url, validTeam)
                .then(() => fail(`url value [${url}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
        it('rejects the promise if the team is invalid', async () => {
            invalidTeamValues.forEach(async team => await unitUnderTest
                .loadAuthenticationCredentials(validConcourseUrl, team)
                .then(() => fail(`team value [${team}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
        it('returns the credentials value from the last saveAuthenticationCredentials() call with the same concourseUrl and team values', async () => {
            await unitUnderTest.saveAuthenticationCredentials(validConcourseUrl, validTeam, validCredentials);
            const actualCredentials = await unitUnderTest.loadAuthenticationCredentials(validConcourseUrl, validTeam);
            expect(actualCredentials).toEqual(validCredentials);
        });
        it('returns the credentials persisted in the state file', async () => {
            const instance1 = new CredentialRepository2(testStateFilename);
            await instance1.load();
            await instance1.saveAuthenticationCredentials(validConcourseUrl, validTeam, validCredentials);

            const instance2 = new CredentialRepository2(testStateFilename);
            await instance2.load();
            const actualResult = await instance2.loadAuthenticationCredentials(validConcourseUrl, validTeam);
            expect(actualResult).toEqual(validCredentials);
        });
    });
    describe('saveAtcToken', () => {
        it('rejects the promise if the URL is invalid', async () => {
            invalidUrlValues.forEach(async url => await unitUnderTest
                .saveAtcToken(url, validTeam, validToken)
                .then(() => fail(`url value [${url}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
        it('rejects the promise if the team is invalid', async () => {
            invalidTeamValues.forEach(async team => await unitUnderTest
                .saveAtcToken(validConcourseUrl, team, validToken)
                .then(() => fail(`team value [${team}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
        it('rejects the promise if the credential is invalid', async () => {
            invalidTokenValues.forEach(async token => await unitUnderTest
                .saveAtcToken(validConcourseUrl, validTeam, token)
                .then(() => fail(`credential value [${token}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
    });
    describe('loadAtcToken', () => {
        it('rejects the promise if the URL is invalid', async () => {
            invalidUrlValues.forEach(async url => await unitUnderTest
                .loadAtcToken(url, validTeam)
                .then(() => fail(`url value [${url}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
        it('rejects the promise if the team is invalid', async () => {
            invalidTeamValues.forEach(async team => await unitUnderTest
                .loadAtcToken(validConcourseUrl, team)
                .then(() => fail(`team value [${team}] should have been rejected`))
                .catch(e => expect(e).toBeDefined()));
        });
        it('returns the token value from the last saveAtcToken() call with the same concourseUrl and team values', async () => {
            await unitUnderTest.saveAtcToken(validConcourseUrl, validTeam, validToken);
            const actualToken = await unitUnderTest.loadAtcToken(validConcourseUrl, validTeam);
            expect(actualToken).toEqual(validToken);
        });
        it('returns the token persisted in the state file', async () => {
            const instance1 = new CredentialRepository2(testStateFilename);
            await instance1.load();
            await instance1.saveAtcToken(validConcourseUrl, validTeam, validToken);

            const instance2 = new CredentialRepository2(testStateFilename);
            await instance2.load();
            const actualResult = await instance2.loadAtcToken(validConcourseUrl, validTeam);
            expect(actualResult).toEqual(validToken);
        });
        it('calls assertAtcToken on the token taken from persistent memory', async () => {
            spyOn(unitUnderTest, 'assertAtcToken')
                .and.returnValue(Promise.resolve());

            // given
            await unitUnderTest.saveAtcToken(validConcourseUrl, validTeam, validToken);

            // when
            await unitUnderTest.loadAtcToken(validConcourseUrl, validTeam);

            // then
            expect(unitUnderTest.assertAtcToken)
                .toHaveBeenCalledWith(validConcourseUrl, validTeam, validToken);
        });
    });
    describe('loadAllAtcTokens', () => {
        it('returns all saved team, atcToken pairs for the given concourseUrl', async () => {
            await unitUnderTest.saveAtcToken(validConcourseUrl, validTeam, validToken);
            await unitUnderTest.saveAtcToken(validConcourseUrl, validTeam2, validToken2);
            await unitUnderTest.saveAtcToken(validConcourseUrl2, validTeam2, validToken);
            await unitUnderTest.saveAtcToken(validConcourseUrl2, validTeam, validToken2);

            const actualResult1 = await unitUnderTest.loadAllAtcTokens(validConcourseUrl);
            expect(actualResult1).toEqual([
                {team: validTeam, token: validToken},
                {team: validTeam2, token: validToken2},
            ]);

            const actualResult2 = await unitUnderTest.loadAllAtcTokens(validConcourseUrl2);
            expect(actualResult2).toEqual([
                {team: validTeam2, token: validToken},
                {team: validTeam, token: validToken2},
            ]);
        });
        it('calls loadAtcToken for known matching team with auth creds or atc tokens', async () => {
            spyOn(unitUnderTest, 'loadAtcToken')
                .and.returnValue(Promise.resolve());
            const differentTeam = 'different team';

            // given
            await unitUnderTest.saveAuthenticationCredentials(validConcourseUrl, validTeam, validCredentials);
            await unitUnderTest.saveAtcToken(validConcourseUrl, differentTeam, validToken);

            // when
            await unitUnderTest.loadAllAtcTokens(validConcourseUrl);

            // then
            expect(unitUnderTest.loadAtcToken).toHaveBeenCalledWith(validConcourseUrl, validTeam);
            expect(unitUnderTest.loadAtcToken).toHaveBeenCalledWith(validConcourseUrl, differentTeam);
        });
    });
    describe('load', () => {
        it('does nothing if the stateFilename property is undefined', async () => {
            const explicitlyUndefined = new CredentialRepository2(undefined);
            await explicitlyUndefined.load();
        });
        it('does nothing if the file specified by stateFilename property does not exist', async () => {
            const filename = 'non-existing-file';
            expect(fs.existsSync(filename)).toBeFalsy(`test file ${filename} should not exist! delete and re-run test!`);
            const explicitlyUndefined = new CredentialRepository2(filename);
            await explicitlyUndefined.load();
        });
        it('does nothing if the file content is invalid', async () => {
            // given
            const invalidFileContent = 'not even a JSON string';
            (unitUnderTest as any).stateFilename = 'not undefined';
            spyOn(fs, 'readFile')
                .and.callFake((fileName, options, cb) => cb(undefined, invalidFileContent));

            // when
            await unitUnderTest.load()
                // then
                .catch(e => fail(e));
        });
        it('does not overwrite the authenticationCredentials if they are undefined in the file content', async () => {
            // stub
            (unitUnderTest as any).stateFilename = 'not undefined';

            // given
            (unitUnderTest as any).authenticationCredentials = {'expected': 'state'};
            const undefinedAuthenticationCredentials = JSON.stringify({
                authenticationCredentials: undefined
            });
            spyOn(fs, 'readFile')
                .and.callFake((fileName, options, cb) => cb(undefined, undefinedAuthenticationCredentials));

            // when
            await unitUnderTest.load();

            // then
            expect((unitUnderTest as any).authenticationCredentials)
                .toEqual({'expected':'state'});
        });
        it('does not overwrite the atcTokens if they are undefined in the file content', async () => {
            // stub
            (unitUnderTest as any).stateFilename = 'not undefined';

            // given
            (unitUnderTest as any).atcTokens = {'expected': 'state'};

            const undefinedAtcTokens = JSON.stringify({
                atcTokens: undefined
            });
            spyOn(fs, 'readFile')
                .and.callFake((fileName, options, cb) => cb(undefined, undefinedAtcTokens));

            // when
            await unitUnderTest.load();

            // then
            expect((unitUnderTest as any).atcTokens)
                .toEqual({'expected':'state'});
        });
    });
    describe('requestAtcToken', () => {
        it('requests a token from ${concourseUrl}/api/v1/teams/${team}/auth/token', async () => {
            const expectedHeaders = {
                'authorization': validCredentials
            };
            const scope = nock(validConcourseUrl, {reqheaders: expectedHeaders})
                .get(`/api/v1/teams/${validTeam}/auth/token`)
                .reply(200, 'OK', {'Set-Cookie': `ATC-Authorization="${validToken}"`});

            await unitUnderTest.requestAtcToken(validConcourseUrl, validTeam, validCredentials);

            expect(scope.isDone())
                .toBeTruthy();
        });
        it('stores a retrieved token', async () => {
            const expectedHeaders = {
                'authorization': validCredentials
            };
            spyOn(unitUnderTest, 'saveAtcToken')
                .and.returnValue(Promise.resolve());
            nock(validConcourseUrl, {reqheaders: expectedHeaders})
                .get(`/api/v1/teams/${validTeam}/auth/token`)
                .reply(200, 'OK', {'Set-Cookie': `ATC-Authorization="${validToken}"`});

            await unitUnderTest.requestAtcToken(validConcourseUrl, validTeam, validCredentials);

            expect(unitUnderTest.saveAtcToken)
                .toHaveBeenCalledWith(validConcourseUrl, validTeam, validToken);
        });
        it('does not store anything if the retrieved token is undefined', async () => {
            const expectedHeaders = {
                'authorization': validCredentials
            };
            spyOn(unitUnderTest, 'saveAtcToken')
                .and.returnValue(Promise.resolve());
            nock(validConcourseUrl, {reqheaders: expectedHeaders})
                .get(`/api/v1/teams/${validTeam}/auth/token`)
                .reply(200, 'OK');

            await unitUnderTest.requestAtcToken(validConcourseUrl, validTeam, validCredentials);

            expect(unitUnderTest.saveAtcToken).toHaveBeenCalledTimes(0);
        });
        it('returns the retrieved token', async () => {
            const expectedHeaders = {
                'authorization': validCredentials
            };
            nock(validConcourseUrl, {reqheaders: expectedHeaders})
                .get(`/api/v1/teams/${validTeam}/auth/token`)
                .reply(200, 'OK', {'Set-Cookie': `ATC-Authorization="${validToken}"`});

            const actualResponse = await unitUnderTest.requestAtcToken(validConcourseUrl, validTeam, validCredentials);

            expect(actualResponse)
                .toEqual(validToken);
        });
        it('resolves to undefined if the supplied credentials are undefined', async () => {
            const actualResult = await unitUnderTest.requestAtcToken(validConcourseUrl, validTeam, undefined)
                .catch(e => fail(e));
            expect(actualResult).toBeUndefined();
        });
        it('resolves to undefined if the GET request fails', async () => {
            const expectedHeaders = {
                'authorization': validCredentials
            };
            nock(validConcourseUrl, {reqheaders: expectedHeaders})
                .get(`/api/v1/teams/${validTeam}/auth/token`)
                .reply(500, 'expected error');

            const actualResponse = await unitUnderTest.requestAtcToken(validConcourseUrl, validTeam, validCredentials);

            expect(actualResponse).toBeUndefined();
        });
        it('resolves to the token if the token save operation fails', async () => {
            const expectedHeaders = {
                'authorization': validCredentials
            };
            nock(validConcourseUrl, {reqheaders: expectedHeaders})
                .get(`/api/v1/teams/${validTeam}/auth/token`)
                .reply(200, 'OK', {'Set-Cookie': `ATC-Authorization="${validToken}"`});

            spyOn(fs, 'writeFile')
                .and.callFake((filename, data, cb) => cb('expected error'));

            (unitUnderTest as any).stateFilename = 'not undefined';
            const actualResponse = await unitUnderTest.requestAtcToken(validConcourseUrl, validTeam, validCredentials);

            expect(fs.writeFile).toHaveBeenCalled();
            expect(actualResponse).toEqual(validToken);
        });
    });
    describe('assertAtcToken', () => {
        it('returns the token if it is not undefined', async () => {
            // when
            const actualResult = await unitUnderTest.assertAtcToken(validConcourseUrl, validTeam, validToken);

            // then
            expect(actualResult).toEqual(validToken);
        });
        it('treats the token as undefined if it is not a valid JWT Bearer token', async () => {
            // given
            const invalidJwtBearerToken = 'something totally different';

            // when
            const actualResult = await unitUnderTest.assertAtcToken(validConcourseUrl, validTeam, invalidJwtBearerToken);

            // then
            expect(actualResult).not.toEqual(invalidJwtBearerToken);
        });
        it('treats a valid JWT as undefined if it is expired', async () => {
            // given
            const expiredJWT = jwt.sign({
                exp: Math.floor(Date.now() / 1000) - 1,
                data: 'foobar'
            }, 'secret');
            const expiredAtcToken = `Bearer ${expiredJWT}`;

            // when
            const actualResult = await unitUnderTest.assertAtcToken(validConcourseUrl, validTeam, expiredAtcToken);

            // then
            expect(actualResult).not.toEqual(expiredAtcToken);
        });
        it('accepts a valid JWT without expiration date', async () => {
            // given
            const endlessJWT = jwt.sign({
                data: 'foobar'
            }, 'secret');
            const expectedToken = `Bearer ${endlessJWT}`;

            // when
            const actualResult = await unitUnderTest.assertAtcToken(validConcourseUrl, validTeam, expectedToken);

            // then
            expect(actualResult).toEqual(expectedToken);
        });
        describe('with an undefined token', () => {
            // given
            const givenToken = undefined;
            it('calls loadAuthenticationCredentials', async () => {
                spyOn(unitUnderTest, 'loadAuthenticationCredentials')
                    .and.returnValue(Promise.resolve());

                // when
                await unitUnderTest.assertAtcToken(validConcourseUrl, validTeam, givenToken);

                // then
                expect(unitUnderTest.loadAuthenticationCredentials)
                    .toHaveBeenCalledWith(validConcourseUrl, validTeam);
            });
            it('calls requestAtcToken with the results of loadAuthenticationCredentials', async () => {
                const expectedCredentials = 'expected credentials';

                // fixture
                spyOn(unitUnderTest, 'loadAuthenticationCredentials')
                    .and.returnValue(Promise.resolve(expectedCredentials));

                // spy
                spyOn(unitUnderTest, 'requestAtcToken')
                    .and.stub();

                // when
                await unitUnderTest.assertAtcToken(validConcourseUrl, validTeam, givenToken);

                // then
                expect(unitUnderTest.requestAtcToken)
                    .toHaveBeenCalledWith(validConcourseUrl, validTeam, expectedCredentials);
            });
        });
    });
});