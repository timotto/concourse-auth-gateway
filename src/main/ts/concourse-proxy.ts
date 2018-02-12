import {Service} from "typedi";
import {ParsedConcourseRequest} from "./concourse-request-parser";
import {ConcourseResponseParser, ParsedConcourseResponse} from "./concourse-response-parser";
import {CredentialRepository2} from "./credential-repository2";
import {Util} from "./util";
import {HttpClient, HttpResponse} from "./http-client";

@Service()
export class ConcourseProxy {

    constructor(private credentialRepository: CredentialRepository2,
                private httpClient: HttpClient) {
    }

    public proxyRequest(req: ParsedConcourseRequest): Promise<ParsedConcourseResponse> {
        if (req.request.url === '/api/v1/pipelines')
            return this.proxyPipelinesRequest(req);

        return this.proxyGenericRequest(req);
    }

    private proxyPipelinesRequest(req: ParsedConcourseRequest): Promise<ParsedConcourseResponse> {
        return this.credentialRepository.loadAllAtcTokens(req.concourseUrl)
            .then(tokens => tokens.concat([{token: undefined}])
                .map(pair => ConcourseProxy.createHeaders(req, pair.token))
                .map(options => this.httpClient.get(`${req.concourseUrl}${req.request.url}`, options)))
            .then(promises => Promise.all(promises))
            .then(responses => responses.reduce(ConcourseProxy.mergeResponseBodies))
            .then((mergedResponse: HttpResponse) =>
                ConcourseResponseParser.parseConcourseResponse(mergedResponse))
    }

    private static mergeResponseBodies(a: HttpResponse, b: HttpResponse): HttpResponse {

        const parsedBodyA = JSON.parse(a.body);
        let parsedBodyB: any;
        try { parsedBodyB = JSON.parse(b.body); }
        catch (e) { parsedBodyB = []; }

        a.body = JSON.stringify(Util.uniqueById(parsedBodyA, parsedBodyB));

        return a;
    }

    private proxyGenericRequest(req: ParsedConcourseRequest): Promise<ParsedConcourseResponse> {
        return this.credentialRepository.loadAtcToken(req.concourseUrl, req.team)
            .catch(() => undefined) // missing token is no error
            .then(atcToken => ConcourseProxy.createHeaders(req, atcToken))
            .then(options => this.httpClient.get(`${req.concourseUrl}${req.request.url}`, options))
            .then(response => ConcourseResponseParser.parseConcourseResponse(response))
            .then(parsedConcourseResponse => this.saveBearerToken(req, parsedConcourseResponse))
    }

    private static createHeaders(req: ParsedConcourseRequest, atcToken: string): any {
        const headers = {};
        if (req.isAuthenticationRequest) {
            headers['Authorization'] = req.authorizationHeaderValue;
        }
        if (atcToken !== undefined) {
            headers['Cookie'] = `ATC-Authorization="${atcToken}"`;
        }
        if (req.ifModifiedSinceHeaderValue) {
            headers['If-Modified-Since'] = req.ifModifiedSinceHeaderValue;
        }
        return headers;
    }

    private saveBearerToken(request: ParsedConcourseRequest, parsedConcourseResponse: ParsedConcourseResponse): Promise<ParsedConcourseResponse> {
        if (parsedConcourseResponse.atcToken === undefined) return Promise.resolve(parsedConcourseResponse);

        return this.credentialRepository.saveAtcToken(request.concourseUrl, request.team, parsedConcourseResponse.atcToken)
            .then(() => parsedConcourseResponse);
    }
}