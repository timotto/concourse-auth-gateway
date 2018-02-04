import {CredentialRepository2} from "./credential-repository2";
import * as fs from 'fs';
import {ConcourseResponseParser} from "./concourse-response-parser";

const testStateFilename = 'test-state.json';

const validConcourseUrl = 'http://concourse.example.com';
const validTeam = 'team1';
const validCredentials = 'Basic dXNlcjpwYXNzd29yZA==';
const validToken = 'Bearer TODO add sample JWT';

const invalidUrlValues = [undefined, null, '', 'not-a-url'];
const invalidTeamValues = [undefined, null, ''];
const invalidCredentialValues = [undefined, null, ''];
const invalidTokenValues = [undefined, null, ''];

describe('Credential Repository 2', () => {
    let unitUnderTest: CredentialRepository2;
    let concourseResponseParser: ConcourseResponseParser;
    beforeEach(async () => {
        concourseResponseParser = new ConcourseResponseParser();
        unitUnderTest = new CredentialRepository2(concourseResponseParser);
        await unitUnderTest.load();
    });
    afterEach(done => fs.unlink(testStateFilename, () => done()));
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
            const instance1 = new CredentialRepository2(concourseResponseParser, testStateFilename);
            await instance1.load();
            await instance1.saveAuthenticationCredentials(validConcourseUrl, validTeam, validCredentials);

            const instance2 = new CredentialRepository2(concourseResponseParser, testStateFilename);
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
            const instance1 = new CredentialRepository2(concourseResponseParser, testStateFilename);
            await instance1.load();
            await instance1.saveAtcToken(validConcourseUrl, validTeam, validToken);

            const instance2 = new CredentialRepository2(concourseResponseParser, testStateFilename);
            await instance2.load();
            const actualResult = await instance2.loadAtcToken(validConcourseUrl, validTeam);
            expect(actualResult).toEqual(validToken);
        });
    });
    describe('loadAllAtcTokens', () => {
        it('returns all saved team, atcToken pairs for the given concourseUrl', async () => {
            const validConcourseUrl2 = 'https://different-concourse.example.com';
            const validTeam2 = 'team2';
            const validToken2 = 'Bearer TODO add different sample JWT';

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
    });
    describe('load', () => {
        it('does nothing if the stateFilename property is undefined', async () => {
            const explicitlyUndefined = new CredentialRepository2(concourseResponseParser, undefined);
            await explicitlyUndefined.load();

            const implicitlyUndefined = new CredentialRepository2(concourseResponseParser);
            await implicitlyUndefined.load();
        });
        it('does nothing if the file specified by stateFilename property does not exist', async () => {
            const filename = 'non-existing-file';
            expect(fs.existsSync(filename)).toBeFalsy(`test file ${filename} should not exist! delete and re-run test!`);
            const explicitlyUndefined = new CredentialRepository2(concourseResponseParser, filename);
            await explicitlyUndefined.load();
        });
    });
});