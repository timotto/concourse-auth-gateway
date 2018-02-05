import * as request from 'request';
import {ParsedConcourseRequest} from "./concourse-request-parser";
import {ConcourseResponseParser, ParsedConcourseResponse} from "./concourse-response-parser";
import {CredentialRepository2} from "./credential-repository2";
import {Util} from "./util";
import {CoreOptions} from "request";

export class ConcourseProxy {

    constructor(private credentialRepository: CredentialRepository2) {
    }

    public proxyRequest(req: ParsedConcourseRequest): Promise<ParsedConcourseResponse> {
        if (req.request.url === '/api/v1/pipelines')
            return this.proxyPipelinesRequest(req);

        return this.proxyGenericRequest(req);
    }

    private proxyPipelinesRequest(req: ParsedConcourseRequest): Promise<ParsedConcourseResponse> {
        const promises = this.credentialRepository.loadAllAtcTokens(req.concourseUrl)
            .concat([{token: undefined}])
            .map(pair => ConcourseProxy.createOptions(req, pair.token))
            .map(options => Util.rpGet(`${req.concourseUrl}${req.request.url}`, options));

        return Promise.all(promises)
            .then(responses => responses.reduce(ConcourseProxy.mergeResponseBodies))
            .then(mergedResponse => ConcourseResponseParser.parseConcourseResponse(mergedResponse))
    }

    private static mergeResponseBodies(a: request.Response, b: request.Response): request.Response {
        if (a === undefined) return b;
        if (b === undefined) return a;

        a.body = JSON.stringify(Util.uniqueById(JSON.parse(a.body), JSON.parse(b.body)));

        return a;
    }

    private proxyGenericRequest(req: ParsedConcourseRequest): Promise<ParsedConcourseResponse> {
        return this.credentialRepository.loadAtcToken(req.concourseUrl, req.team)
            .catch(() => undefined) // missing token is no error
            .then(atcToken => ConcourseProxy.createOptions(req, atcToken))
            .then(options => Util.rpGet(`${req.concourseUrl}${req.request.url}`, options))
            .then(response => ConcourseResponseParser.parseConcourseResponse(response))
            .then(parsedConcourseResponse => this.saveBearerToken(req, parsedConcourseResponse))
    }

    private static createOptions(req: ParsedConcourseRequest, atcToken: string): CoreOptions {
        const options = {headers:{}};
        if (req.isAuthenticationRequest) {
            options.headers['Authorization'] = req.authorizationHeaderValue;
        }
        if (atcToken !== undefined) {
            options.headers['Cookie'] = `ATC-Authorization="${atcToken}"`;
        }
        return options;
    }

    private saveBearerToken(request: ParsedConcourseRequest, parsedConcourseResponse: ParsedConcourseResponse): Promise<ParsedConcourseResponse> {
        if (parsedConcourseResponse.atcToken === undefined) return Promise.resolve(parsedConcourseResponse);

        return this.credentialRepository.saveAtcToken(request.concourseUrl, request.team, parsedConcourseResponse.atcToken)
            .then(() => parsedConcourseResponse);
    }
}