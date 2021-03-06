import {Service} from "typedi";
import {Router, Request, Response} from 'express';
import {ConcourseRequestParser, ParsedConcourseRequest} from "./concourse-request-parser";
import {ConcourseProxy} from "./concourse-proxy";
import {ParsedConcourseResponse} from "./concourse-response-parser";
import {CredentialService} from "./credential-service";
import {Util} from "./util";

@Service()
export class ConcourseEndpoint2 {

    readonly router: Router = Router();

    constructor(private credentialRepository: CredentialService,
                private concourseProxy: ConcourseProxy){

        this.router.get('*', this.handleRequest.bind(this));
    }

    public handleRequest(req: Request, res: Response): Promise<Response> {
        const parsedConcourseRequest = ConcourseRequestParser.parseRequest(req);

        if (parsedConcourseRequest.concourseUrl === undefined) {
            return Promise.resolve(res.status(400).send('X-Concourse-Url HTTP header is required'));
        }

        return this.extractAuthenticationCredentials(parsedConcourseRequest).
            then(() => this.concourseProxy.proxyRequest(parsedConcourseRequest))
            .then(parsedResponse => ConcourseEndpoint2.forwardResponse(parsedResponse, res))
            .catch(error => res.status(500).send(error));
    }

    private extractAuthenticationCredentials(parsedConcourseRequest: ParsedConcourseRequest): Promise<void> {
        if (!parsedConcourseRequest.isAuthenticationRequest) return Promise.resolve();

        return this.credentialRepository.saveAuthenticationCredentials(parsedConcourseRequest.concourseUrl, parsedConcourseRequest.team, parsedConcourseRequest.authorizationHeaderValue);
    }

    private static forwardResponse(parsedConcourseResponse: ParsedConcourseResponse, res: Response): Promise<Response> {
        if (parsedConcourseResponse.csrfToken) {
            res.header('X-Csrf-Token', parsedConcourseResponse.csrfToken);
        }
        res.statusCode = parsedConcourseResponse.response.statusCode;
        res.statusMessage = parsedConcourseResponse.response.statusMessage;
        LEGAL_HEADERS.forEach(key =>
            this.copyHeaderValue(parsedConcourseResponse, res, key));
        res.send(parsedConcourseResponse.response.body);
        return Promise.resolve(res);
    }

    private static copyHeaderValue(parsedConcourseResponse: ParsedConcourseResponse,
                                   res: Response,
                                   key: string) {
        const lowerCaseKey = key.toLocaleLowerCase();

        const headerValue = Util.firstHeaderValue(
            parsedConcourseResponse.response.headers[lowerCaseKey]);

        if (headerValue) res.header(key, headerValue);
    }
}

const LEGAL_HEADERS: string[] = ['Content-Type', 'Date', 'Last-Modified'];