import {Request} from 'express';
import {Util} from "./util";

const teamUrlMatcher = /\/api\/v1\/teams\/([^\/]*)\/.*/;
const teamUrlMatcher2 = /team_name=([^&]*)/;

export class ConcourseRequestParser {
    public static parseRequest(req: Request): ParsedConcourseRequest {
        const concourseUrl = process.env.CONCOURSE_URL || Util.firstHeaderValue(req.headers['x-concourse-url']);
        const teamUrl = req.url.match(teamUrlMatcher);
        const teamUrl2 = req.url.match(teamUrlMatcher2);
        const team = teamUrl ? teamUrl[1] : teamUrl2 ? teamUrl2[1] : undefined;
        const authorizationHeaderValue = Util.firstHeaderValue(req.headers['authorization']);

        const parsedConcourseRequest = new ParsedConcourseRequest(req, concourseUrl, team, authorizationHeaderValue);
        parsedConcourseRequest.ifModifiedSinceHeaderValue = Util.firstHeaderValue(req.headers['if-modified-since']);
        return parsedConcourseRequest;
    }
}

export class ParsedConcourseRequest {
    public ifModifiedSinceHeaderValue: string;
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