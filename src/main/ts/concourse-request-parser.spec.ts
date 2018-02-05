import {ConcourseRequestParser, ParsedConcourseRequest} from "./concourse-request-parser";
import {Request} from 'express';

describe('ConcourseRequestParser', () => {
    describe('parseRequest', () => {
        afterEach(() => {
            delete process.env.CONCOURSE_URL;
        });
        it('fills the concourseUrl property of the response with the X-Concourse-Url HTTP header value if found in the request', () => {
            const expectedConcourseUrl = 'http://expected-concourse.example.com';
            const request: Request = jasmine.createSpyObj<Request>("Request", ['headers', 'url']);

            request.url = 'url';

            request.headers = {'x-concourse-url': expectedConcourseUrl};
            expect(ConcourseRequestParser.parseRequest(request).concourseUrl).toEqual(expectedConcourseUrl);

            request.headers = {'x-concourse-url': [expectedConcourseUrl, undefined]};
            expect(ConcourseRequestParser.parseRequest(request).concourseUrl).toEqual(expectedConcourseUrl);

            request.headers = {'x-concourse-url': [undefined, expectedConcourseUrl, undefined]};
            expect(ConcourseRequestParser.parseRequest(request).concourseUrl).toEqual(expectedConcourseUrl);

            request.headers = {'x-concourse-url': [undefined, undefined]};
            expect(ConcourseRequestParser.parseRequest(request).concourseUrl).toEqual(undefined);
        });
        it('fills the team property of the response if the request url matches the pattern "/api/v1/teams/(.*)/.*"', () => {
            const expectedConcourseUrl = 'http://expected-concourse.example.com';
            const expectedTeam = 'team-expected';
            const request: Request = jasmine.createSpyObj<Request>("Request", ['headers', 'url']);

            request.headers = {'x-concourse-url': expectedConcourseUrl};

            request.url = `/api/v1/teams/${expectedTeam}/something`;
            expect(ConcourseRequestParser.parseRequest(request).team).toEqual(expectedTeam);

            request.url = `/api/v1/teams/${expectedTeam}/pipelines`;
            expect(ConcourseRequestParser.parseRequest(request).team).toEqual(expectedTeam);

            request.url = `/api/v1/teams/${expectedTeam}/some/lower`;
            expect(ConcourseRequestParser.parseRequest(request).team).toEqual(expectedTeam);

            request.url = `/api/v1/user`;
            expect(ConcourseRequestParser.parseRequest(request).team).toEqual(undefined);
        });
        it('fills the authorizationHeaderValue of the response if an Authorization HTTP header value is found in the request', () => {
            const expectedConcourseUrl = 'http://expected-concourse.example.com';
            const expectedTeam = 'team-expected';
            const expectedAuthorizationValue = 'Basic something';
            const request: Request = jasmine.createSpyObj<Request>("Request", ['headers', 'url']);

            request.headers = {
                'x-concourse-url': expectedConcourseUrl,
                'authorization': expectedAuthorizationValue
            };

            request.url = `/api/v1/teams/${expectedTeam}/something`;
            expect(ConcourseRequestParser.parseRequest(request).authorizationHeaderValue).toEqual(expectedAuthorizationValue);
        });
        it('always uses the CONCOURSE_URL environment variable value as concourseUrl if defined', () => {
            const expectedConcourseUrl = 'http://expected-concourse.example.com';
            const unexpectedConcourseUrl = 'http://unexpected-concourse.example.com';
            const request: Request = jasmine.createSpyObj<Request>("Request", ['headers', 'url']);
            process.env.CONCOURSE_URL = expectedConcourseUrl;
            request.url = 'url';

            expect(ConcourseRequestParser.parseRequest(request).concourseUrl).toEqual(expectedConcourseUrl);

            request.headers = {'x-concourse-url': unexpectedConcourseUrl};
            expect(ConcourseRequestParser.parseRequest(request).concourseUrl).toEqual(expectedConcourseUrl);
        });
    });
});

describe('ParsedConcourseRequest', () => {
    describe('isAuthenticationRequest', () => {
        it('returns true if concourseUrl, team, and authorizationHeaderValue properties are not undefined', () => {
            expect(new ParsedConcourseRequest(undefined, 'a', 'b', 'c').isAuthenticationRequest).toBeTruthy();
        });
        it('returns false if concourseUrl and team properties are not undefined but authorizationHeaderValue is undefined', () => {
            expect(new ParsedConcourseRequest(undefined, 'a', 'b', undefined).isAuthenticationRequest).toBeFalsy();
        });
        it('returns false if concourseUrl and authorizationHeaderValue properties are not undefined but team is undefined', () => {
            expect(new ParsedConcourseRequest(undefined, 'a', undefined, 'c').isAuthenticationRequest).toBeFalsy();
        });
        it('returns false if team and authorizationHeaderValue properties are not undefined but concourseUrl is undefined', () => {
            expect(new ParsedConcourseRequest(undefined, undefined, 'b', 'c').isAuthenticationRequest).toBeFalsy();
        });
    })
});