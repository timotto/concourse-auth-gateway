import {ConcourseEndpoint2} from "./concourse-endpoint2";
import {CredentialRepository2} from "./credential-repository2";
import {ConcourseRequestParser, ParsedConcourseRequest} from "./concourse-request-parser";
import {ConcourseProxy} from "./concourse-proxy";
import {Request, Response} from 'express';
import * as nock from "nock";
import {ParsedConcourseResponse} from "./concourse-response-parser";

const mockConcourseUrl = 'http://concourse.example.com';
const mockTeam = 'mock-team';

describe('Concourse Endpoint 2', () => {
    let unitUnderTest: ConcourseEndpoint2;
    let credentialRepository2: CredentialRepository2;
    let concourseProxy: ConcourseProxy;

    let mockResponse: Response;
    let mockRequest: any;
    beforeEach(() => {
        credentialRepository2 = new CredentialRepository2(undefined);
        concourseProxy = new ConcourseProxy(credentialRepository2);
        unitUnderTest = new ConcourseEndpoint2(credentialRepository2, concourseProxy);

        mockResponse = jasmine.createSpyObj<Response>('Response', ['status', 'send', 'contentType']);
        (mockResponse.status as jasmine.Spy).and.returnValue(mockResponse);
        (mockResponse.send as jasmine.Spy).and.returnValue(mockResponse);
        (mockResponse as any).headers = {};

        mockRequest = jasmine.createSpyObj<Request>('Request', ['status', 'send', 'get', 'headers']);
    });
    describe('handleRequest', () => {
        let mockParsedRequest: ParsedConcourseRequest;
        let mockParsedResponse: ParsedConcourseResponse;
        beforeEach(() => {
            mockParsedRequest = new ParsedConcourseRequest(mockRequest, mockConcourseUrl, mockTeam, undefined);
            mockParsedResponse = jasmine.createSpyObj<ParsedConcourseResponse>('ParsedConcourseResponse', ['setCsrfToken']);
            (mockParsedResponse as any).response = mockResponse;
        });
        it('uses the ConcourseRequestParser.parseRequest function on the request', async () => {
            // stub
            spyOn(concourseProxy, 'proxyRequest')
                .and.returnValue(Promise.resolve(mockParsedResponse));

            // spy
            spyOn(ConcourseRequestParser, 'parseRequest')
                .and.returnValue(mockParsedRequest);

            // given
            await unitUnderTest.handleRequest(mockRequest, mockResponse);
            expect(ConcourseRequestParser.parseRequest)
                .toHaveBeenCalledWith(mockRequest);
        });
        it('saves authentication credentials if found in the request', async () => {
            // stub
            spyOn(concourseProxy, 'proxyRequest')
                .and.returnValue(Promise.resolve(mockParsedResponse));

            // spy
            spyOn(credentialRepository2, 'saveAuthenticationCredentials')
                .and.returnValue(Promise.resolve());

            // given
            const expectedAuthenticationValue = 'Basic dXNlcjpwYXNzd29yZA==';
            spyOn(ConcourseRequestParser, 'parseRequest')
                .and.returnValue(new ParsedConcourseRequest(mockRequest, mockConcourseUrl, mockTeam, expectedAuthenticationValue));

            // when
            await unitUnderTest.handleRequest(mockRequest, mockResponse);

            // then
            expect(credentialRepository2.saveAuthenticationCredentials)
                .toHaveBeenCalledWith(mockConcourseUrl, mockTeam, expectedAuthenticationValue);
        });
        it('rejects the promise if saving the credentials fails', async () => {
            const expectedReason = 'expected reason';
            // stub
            spyOn(credentialRepository2, 'saveAuthenticationCredentials')
                .and.returnValue(Promise.reject(expectedReason));
            spyOn(concourseProxy, 'proxyRequest')
                .and.returnValue(Promise.resolve(mockParsedResponse));

            // given
            const expectedAuthenticationValue = 'Basic dXNlcjpwYXNzd29yZA==';
            spyOn(ConcourseRequestParser, 'parseRequest')
                .and.returnValue(new ParsedConcourseRequest(mockRequest, mockConcourseUrl, mockTeam, expectedAuthenticationValue));

            // when
            await unitUnderTest.handleRequest(mockRequest, mockResponse);

            // then
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith(expectedReason);
        });
        it('calls the ConcourseProxy.proxyRequest function with ConcourseRequestParse.parseRequest result', async () => {
            // spy
            spyOn(concourseProxy, 'proxyRequest')
                .and.returnValue(Promise.resolve(mockParsedResponse));

            // given
            const parsedConcourseRequest = new ParsedConcourseRequest(mockRequest, mockConcourseUrl, mockTeam, undefined);
            spyOn(ConcourseRequestParser, 'parseRequest')
                .and.returnValue(parsedConcourseRequest);

            // when
            await unitUnderTest.handleRequest(mockRequest, mockResponse);

            // then
            expect(concourseProxy.proxyRequest)
                .toHaveBeenCalledWith(parsedConcourseRequest);
        });
        it('responds with a 500 error and the error message if the ConcourseProxy.proxyRequest is rejected', async () => {
            // stub
            const parsedConcourseRequest = new ParsedConcourseRequest(mockRequest, mockConcourseUrl, mockTeam, undefined);
            spyOn(ConcourseRequestParser, 'parseRequest')
                .and.returnValue(parsedConcourseRequest);

            // spy
            const responseSpy = jasmine.createSpyObj<Response>('Response', ['status', 'send']);
            responseSpy.status.and.returnValue(responseSpy);
            responseSpy.send.and.returnValue(responseSpy);

            // given
            const expectedMessage = 'expected message';
            spyOn(concourseProxy, 'proxyRequest')
                .and.returnValue(Promise.reject(expectedMessage));

            // when
            await unitUnderTest.handleRequest(mockRequest, responseSpy);

            // then
            expect(responseSpy.status).toHaveBeenCalledWith(500);
            expect(responseSpy.send).toHaveBeenCalledWith(expectedMessage);
        });
        it('forwards the X-Csrf-Token HTTP header', async () => {
            const expectedCsrfToken = 'csrf token value';

            const requestStub = jasmine.createSpyObj<Request>('Request', ['headers', 'url']);
            (requestStub as any)['headers'] ={'x-concourse-url': mockConcourseUrl};
            (requestStub as any)['url'] = `/api/v1/teams/${mockTeam}/auth/token`;

            const responseSpy = jasmine.createSpyObj<Response>('Response', ['header', 'status', 'send']);
            responseSpy.status.and.returnValue(responseSpy);
            responseSpy.send.and.returnValue(responseSpy);

            nock(mockConcourseUrl)
                .get(requestStub.url)
                .reply(200, 'OK', {'X-Csrf-Token': expectedCsrfToken});

            await unitUnderTest.handleRequest(requestStub, responseSpy);

            expect(responseSpy.header).toHaveBeenCalledWith('X-Csrf-Token', expectedCsrfToken);
        });
        it('forwards status code and message, content type, date, and last-modified headers, and response body', async () => {
            const requestStub = jasmine.createSpyObj<Request>('Request', ['headers', 'url']);
            (requestStub as any)['headers'] ={'x-concourse-url': mockConcourseUrl};
            (requestStub as any)['url'] = `/api/v1/teams/${mockTeam}/auth/token`;

            const responseSpy = jasmine.createSpyObj<Response>('Response', ['header', 'status', 'send', 'contentType']);
            responseSpy.status.and.returnValue(responseSpy);
            responseSpy.send.and.returnValue(responseSpy);

            const expectedStatusCode = 201;
            const expectedResponseBody = 'response body';
            const expectedContentType = 'text/expected';
            const expectedDate = 'expected date';
            const expectedLastModified = 'last modified';

            nock(mockConcourseUrl)
                .get(requestStub.url)
                .reply(expectedStatusCode, expectedResponseBody, {
                    'content-type': expectedContentType,
                    'date': expectedDate,
                    'last-modified': expectedLastModified
                });

            await unitUnderTest.handleRequest(requestStub, responseSpy);

            expect(responseSpy.statusCode).toEqual(expectedStatusCode);
            expect(responseSpy.contentType).toHaveBeenCalledWith(expectedContentType);
            expect(responseSpy.header).toHaveBeenCalledWith('Date', expectedDate);
            expect(responseSpy.header).toHaveBeenCalledWith('Last-Modified', expectedLastModified);
            expect(responseSpy.send).toHaveBeenCalledWith(expectedResponseBody);

            responseSpy.contentType.calls.reset();
            responseSpy.header.calls.reset();
            responseSpy.send.calls.reset();

            nock(mockConcourseUrl)
                .get(requestStub.url)
                .reply(expectedStatusCode, expectedResponseBody);

            await unitUnderTest.handleRequest(requestStub, responseSpy);

            expect(responseSpy.statusCode).toEqual(expectedStatusCode);
            expect(responseSpy.contentType).toHaveBeenCalledWith(undefined);
            expect(responseSpy.header).toHaveBeenCalledTimes(0);
            expect(responseSpy.header).toHaveBeenCalledTimes(0);
            expect(responseSpy.send).toHaveBeenCalledWith(expectedResponseBody);
        });
        it('responds with a 400 bad request error if the X-Concourse-Url HTTP header is missing', async () => {
            spyOn(ConcourseRequestParser, 'parseRequest')
                .and.returnValue(new ParsedConcourseRequest(mockRequest, undefined, mockTeam, undefined));

            await unitUnderTest.handleRequest(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
        });
    });
});