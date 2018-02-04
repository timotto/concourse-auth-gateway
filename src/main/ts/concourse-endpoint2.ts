import {Router, Request, Response, NextFunction} from 'express';
import {ConcourseRequestParser, ParsedConcourseRequest} from "./concourse-request-parser";
import {ConcourseProxy} from "./concourse-proxy";
import {ParsedConcourseResponse} from "./concourse-response-parser";
import {CredentialRepository2} from "./credential-repository2";

export class ConcourseEndpoint2 {

    constructor(private credentialRepository: CredentialRepository2,
                private concourseRequestParser: ConcourseRequestParser,
                private concourseProxy: ConcourseProxy,
                readonly router: Router){

        router.get('*', this.handleRequest.bind(this));
    }

    public handleRequest(req: Request, res: Response): Promise<Response> {
        const parsedConcourseRequest = this.concourseRequestParser.parseRequest(req);

        if (parsedConcourseRequest.concourseUrl === undefined) {
            return Promise.resolve(res.status(400).send('X-Concourse-Url HTTP header is required'));
        }

        this.extractAuthenticationCredentials(parsedConcourseRequest);

        return this.concourseProxy.proxyRequest(parsedConcourseRequest)
            .then(parsedResponse => this.forwardResponse(parsedResponse, res))
            .catch(error => {
                console.error(error);
                return res.status(500).send(error.message)
            });
    }

    private extractAuthenticationCredentials(parsedConcourseRequest: ParsedConcourseRequest) {
        if (!parsedConcourseRequest.isAuthenticationRequest) return;

        this.credentialRepository.saveAuthenticationCredentials(parsedConcourseRequest.concourseUrl, parsedConcourseRequest.team, parsedConcourseRequest.authorizationHeaderValue)
            .catch(e => console.error(`failed to save authentication credentials for team ${parsedConcourseRequest.team} at url ${parsedConcourseRequest.concourseUrl}`, e));
    }

    private forwardResponse(parsedConcourseResponse: ParsedConcourseResponse, res: Response): Promise<Response> {
        if (parsedConcourseResponse.csrfToken) {
            res.header('X-Csrf-Token', parsedConcourseResponse.csrfToken);
        }
        res.statusCode = parsedConcourseResponse.response.statusCode;
        res.statusMessage = parsedConcourseResponse.response.statusMessage;
        res.contentType(parsedConcourseResponse.response.headers['content-type']);
        res.send(parsedConcourseResponse.response.body);
        return Promise.resolve(res);
    }
}