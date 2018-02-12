import * as request from "request";
import {HttpClient, HttpResponse} from "./http-client";
import any = jasmine.any;

describe('HttpClient', () => {
    let unitUnderTest: HttpClient;
    beforeEach(() => {
        unitUnderTest = new HttpClient();
    });
    describe('get', () => {
        it('calls request.get with proper CoreOptions if headers are defined', async () => {
            const definedUrl = 'defined url';
            spyOn(request, 'get')
                .and.callFake((url,o,cb) => cb());

            // given
            const givenHeaders: any = {'some':'header'};

            // when
            await unitUnderTest.get(definedUrl, givenHeaders);

            // then
            expect(request.get).toHaveBeenCalledWith(definedUrl, {headers: givenHeaders}, any(Function));
        });
        it('calls request.get with undefined CoreOptions if no headers are defined', async () => {
            const definedUrl = 'defined url';
            spyOn(request, 'get')
                .and.callFake((url,o,cb) => cb());

            // given
            const givenHeaders: any = undefined;

            // when
            await unitUnderTest.get(definedUrl, givenHeaders);

            // then
            expect(request.get).toHaveBeenCalledWith(definedUrl, undefined, any(Function));
        });
        it('calls request.get with the given arguments', async () => {
            const expectedUrl = 'expected url';
            const definedHeaders: any = {'some':'header'};
            let expectedHeaders;
            spyOn(request, 'get')
                .and.callFake((url,o,cb) => cb());

            // given
            expectedHeaders = undefined;

            // when
            await unitUnderTest.get(expectedUrl, undefined);

            // then
            expect(request.get).toHaveBeenCalledWith(expectedUrl, expectedHeaders, any(Function));

            (request.get as jasmine.Spy).calls.reset();

            // given
            expectedHeaders = definedHeaders;

            // when
            await unitUnderTest.get(expectedUrl, definedHeaders);

            // then
            expect(request.get).toHaveBeenCalledWith(expectedUrl, {headers: expectedHeaders}, any(Function));
        });
        it('resolves the promise with the response of the request', async () => {
            // given
            const expectedStatusCode = 200;
            const expectedStatusMessage = 'OK';
            const expectedBody = 'expected response body';
            const expectedHeaders = {expected: 'header value'};
            const mockRequestResponse: request.Response
                = jasmine.createSpyObj<request.Response>('Response', ['something']);
            mockRequestResponse.statusCode = expectedStatusCode;
            mockRequestResponse.statusMessage = expectedStatusMessage;
            mockRequestResponse.body = expectedBody;
            mockRequestResponse.headers = expectedHeaders;
            const expectedResponse = HttpResponse.fromRequestResponse(mockRequestResponse);

            spyOn(request, 'get')
                .and.callFake((url,o,cb) => cb(undefined, mockRequestResponse));

            // when
            const actualResponse = await unitUnderTest.get('something', undefined);

            //then
            expect(actualResponse).toEqual(expectedResponse);
        });
        it('rejects the promise with reason if there was an error', async () => {
            // given
            const expectedReason = 'some reason';
            spyOn(request, 'get')
                .and.callFake((url,o,cb) => cb(expectedReason));

            // when
            await unitUnderTest.get('something', undefined)
                .then(() => fail())
                //then
                .catch(error => expect(error).toBe(expectedReason));
        });
    });
});

describe('HttpResponse', () => {
    describe('fromRequestResponse', () => {
        const expectedStatusCode = 200;
        const expectedStatusMessage = 'OK';
        const expectedBody = 'expected response body';
        const expectedHeaders = {expected: 'header value'};

        let mockRequestResponse: request.Response;
        beforeEach(() => {
            mockRequestResponse = jasmine.createSpyObj<request.Response>('Response', ['something']);
            mockRequestResponse.statusCode = expectedStatusCode;
            mockRequestResponse.statusMessage = expectedStatusMessage;
            mockRequestResponse.body = expectedBody;
            mockRequestResponse.headers = expectedHeaders;
        });
        it('returns undefined if the request.Response argument is undefined', () =>
            expect(HttpResponse.fromRequestResponse(undefined)).toBeUndefined());

        it('copies the statusCode', () =>
            expect(HttpResponse.fromRequestResponse(mockRequestResponse).statusCode)
                .toEqual(expectedStatusCode));
        it('copies the statusMessage', () =>
            expect(HttpResponse.fromRequestResponse(mockRequestResponse).statusMessage)
                .toEqual(expectedStatusMessage));
        it('copies the body', () =>
            expect(HttpResponse.fromRequestResponse(mockRequestResponse).body)
                .toEqual(expectedBody));
        it('copies the headers', () =>
            expect(HttpResponse.fromRequestResponse(mockRequestResponse).headers)
                .toEqual(expectedHeaders));
    });
});