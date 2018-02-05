import {Request} from 'express';
import {Util} from "./util";

const teamUrlMatcher = /\/api\/v1\/teams\/([^\/]*)\/.*/;

export class ConcourseRequestParser {
    public static parseRequest(req: Request): ParsedConcourseRequest {
        const concourseUrl = Util.firstHeaderValue(req.headers['x-concourse-url']);
        const teamUrl = req.url.match(teamUrlMatcher);
        const team = teamUrl ? teamUrl[1] : undefined;
        const authorizationHeaderValue = Util.firstHeaderValue(req.headers['authorization']);

        return new ParsedConcourseRequest(req, concourseUrl, team, authorizationHeaderValue);
    }
}

export class ParsedConcourseRequest {
    constructor(public request: Request,
                public concourseUrl: string,
                public team: string,
                public authorizationHeaderValue: string) {
    }

    get isAuthenticationRequest(): boolean {
        return this.concourseUrl !== undefined
            && this.team !== undefined
            && this.authorizationHeaderValue !== undefined;
    }
}