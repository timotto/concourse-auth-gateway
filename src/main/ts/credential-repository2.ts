import * as url from 'url';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import {Util} from "./util";
import {ConcourseResponseParser} from "./concourse-response-parser";
import {CoreOptions} from "request";

export class CredentialRepository2 {

    private authenticationCredentials = {};

    private atcTokens = {};

    constructor(private stateFilename?: string) {}

    public saveAuthenticationCredentials(concourseUrl: string, team: string, credentials: string): Promise<void> {
        return assertUrl(concourseUrl)
            .then(() => assertStringValue(team, 'team name'))
            .then(() => assertStringValue(credentials, 'credentials value'))
            .then(() => {this.authenticationCredentials[mergeKeyPair(concourseUrl, team)] = credentials;})
            .then(() => this.save());
    }

    public loadAuthenticationCredentials(concourseUrl: string, team: string): Promise<string> {
        return assertUrl(concourseUrl)
            .then(() => assertStringValue(team, 'team name'))
            .then(() => this.authenticationCredentials[mergeKeyPair(concourseUrl, team)]);
    }

    public saveAtcToken(concourseUrl: string, team: string, token: string): Promise<void> {
        return assertUrl(concourseUrl)
            .then(() => assertStringValue(team, 'team name'))
            .then(() => assertStringValue(token, 'token value'))
            .then(() => {this.atcTokens[mergeKeyPair(concourseUrl, team)] = token;})
            .then(() => this.save());
    }

    public loadAtcToken(concourseUrl: string, team: string): Promise<string> {
        return assertUrl(concourseUrl)
            .then(() => assertStringValue(team, 'team name'))
            .then(() => this.atcTokens[mergeKeyPair(concourseUrl, team)])
            .then(atcToken => this.assertAtcToken(concourseUrl, team, atcToken));
    }

    public loadAllAtcTokens(concourseUrl: string): Promise<any[]> {
        return Promise.resolve(Object.keys(this.atcTokens)
            .map(keyPairString => ({s: keyPairString, o: JSON.parse(keyPairString)}))
            .filter(p => p.o.url === concourseUrl)
            .map(p => ({team: p.o.team, token: this.atcTokens[p.s]})));
    }

    public load(): Promise<void> {
        if (this.stateFilename === undefined) return Promise.resolve();

        return new Promise<void>(resolve => fs.readFile(this.stateFilename, 'utf-8', ((err, data) => {
            this.loadFromFile(err, data);
            resolve();
        })));
    }

    public assertAtcToken(concourseUrl: string, team: string, atcToken: string | undefined): Promise<string | undefined> {
        const parsedJwt = parseAuthorizationHeaderBearerTokenValue(atcToken);
        const expiration = parsedJwt ? (parsedJwt as any).exp : undefined;
        const isExpired = expiration !== undefined && expiration < (Date.now() / 1000);
        if (parsedJwt && !isExpired && atcToken !== undefined) return Promise.resolve(atcToken);

        return this.loadAuthenticationCredentials(concourseUrl, team)
            .then(credentials => this.requestAtcToken(concourseUrl, team, credentials));
    }

    public requestAtcToken(concourseUrl: string, team: string, credentials: string): Promise<string|undefined> {
        if (credentials === undefined) return Promise.resolve(credentials);

        const options: CoreOptions = {headers:{'Authorization': credentials}};

        return Util.rpGet(`${concourseUrl}/api/v1/teams/${team}/auth/token`, options)
            .then(response => ConcourseResponseParser.parseConcourseResponse(response))
            .then(parsedResponse => parsedResponse.atcToken)
            .then(atcToken => atcToken === undefined
                ? Promise.resolve(undefined)
                : this.saveAtcToken(concourseUrl, team, atcToken)
                    .then(() => atcToken)
                    .catch(() => atcToken))
            .catch(() => undefined);
    }

    private loadFromFile(err, data) {
        if (err) return;

        let parsedData: any;
        try { parsedData = JSON.parse(data); }
        catch (e) { return; }

        if (parsedData['authenticationCredentials'] !== undefined)
            this.authenticationCredentials = parsedData['authenticationCredentials'];
        if (parsedData['atcTokens'] !== undefined)
            this.atcTokens = parsedData['atcTokens'];
    }

    private save(): Promise<void> {
        return this.stateFilename === undefined
            ? Promise.resolve()
            : new Promise<void>((resolve, reject) => fs.writeFile(this.stateFilename, JSON.stringify({
                authenticationCredentials: this.authenticationCredentials,
                atcTokens: this.atcTokens
            }), err => err ? reject(err) : resolve()));
    }
}

const parseAuthorizationHeaderBearerTokenValue = (atcTokenHeaderValue: string) => {
    if (atcTokenHeaderValue === undefined) return undefined;
    if (!atcTokenHeaderValue.startsWith('Bearer ')) return undefined;
    return jwt.decode(atcTokenHeaderValue.substr(7));
};

const assertUrl = (concourseUrl): Promise<void> => {
    let parsedUrl: url.UrlWithStringQuery;

    try { parsedUrl = url.parse(concourseUrl); }
    catch (e) { return Promise.reject(`invalid url (${e.message}): ${concourseUrl}`); }

    if (parsedUrl.hostname === null)
        return Promise.reject(`no hostname in url: ${concourseUrl}`);

    return Promise.resolve();
};

const assertStringValue = (stringValue: string, description: string): Promise<void> =>
    stringValue===undefined||stringValue===null||stringValue===''
        ?Promise.reject(`invalid ${description}: ${stringValue}`)
        :Promise.resolve();

const mergeKeyPair = (concourseUrl: string, team: string): string =>
    JSON.stringify({url: concourseUrl, team: team});
