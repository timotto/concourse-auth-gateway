import {Service} from "typedi";
import * as url from 'url';
import * as jwt from 'jsonwebtoken';
import {ConcourseResponseParser} from "./concourse-response-parser";
import {HttpClient} from "./http-client";
import {CredentialRepository} from "./credential-repository";

@Service()
export class CredentialService {

    constructor(private httpClient: HttpClient,
                private credentialRepository: CredentialRepository) {}

    public saveAuthenticationCredentials(concourseUrl: string, team: string, credentials: string): Promise<void> {
        return assertUrl(concourseUrl)
            .then(() => assertStringValue(team, 'team name'))
            .then(() => assertStringValue(credentials, 'credentials value'))
            .then(() => this.credentialRepository.set('auth', mergeKeyPair(concourseUrl, team), credentials));
    }

    public loadAuthenticationCredentials(concourseUrl: string, team: string): Promise<string> {
        return assertUrl(concourseUrl)
            .then(() => assertStringValue(team, 'team name'))
            .then(() => this.credentialRepository.get('auth', mergeKeyPair(concourseUrl, team)))
    }

    public saveAtcToken(concourseUrl: string, team: string, token: string): Promise<void> {
        return assertUrl(concourseUrl)
            .then(() => assertStringValue(team, 'team name'))
            .then(() => assertStringValue(token, 'token value'))
            .then(() => this.credentialRepository.set('token', mergeKeyPair(concourseUrl, team), token));
    }

    public loadAtcToken(concourseUrl: string, team: string): Promise<string> {
        return assertUrl(concourseUrl)
            .then(() => assertStringValue(team, 'team name'))
            .then(() => this.credentialRepository.get('token', mergeKeyPair(concourseUrl, team)))
            .then(atcToken => this.assertAtcToken(concourseUrl, team, atcToken));
    }

    public loadAllAtcTokens(concourseUrlMaybeWithSlash: string): Promise<any[]> {
        const concourseUrl = removeTrailingSlash(concourseUrlMaybeWithSlash);
        const loader = group => this.credentialRepository.keys(group)
            .then(keys => keys
            .map(k => JSON.parse(k))
            .filter(o => o.url === concourseUrl)
            .map(o => o.team));

        const filterer = (a,b) => a.concat(...b.filter(team =>
            a.filter(x => x === team).length === 0));

        const mapper = team => this.loadAtcToken(concourseUrl, team)
            .then(token => ({team, token}));

        return Promise.all([loader('auth'), loader('token')])
            .then(groups => filterer(groups[0], groups[1])
                .map(team => mapper(team)))
            .then(loadTokenOperations =>
                Promise.all(loadTokenOperations));
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

        const options: any = {'Authorization': credentials};

        return this.httpClient.get(`${concourseUrl}/api/v1/teams/${team}/auth/token`, options)
            .then(response => ConcourseResponseParser.parseConcourseResponse(response))
            .then(parsedResponse => parsedResponse.atcToken)
            .then(atcToken => atcToken === undefined
                ? Promise.resolve(undefined)
                : this.saveAtcToken(concourseUrl, team, atcToken)
                    .then(() => atcToken)
                    .catch(() => atcToken));
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
    JSON.stringify({url: removeTrailingSlash(concourseUrl), team: team});

const removeTrailingSlash = (url: string) => url.replace(/\/$/, '');