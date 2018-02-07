import {ConcourseResponseParser, ParsedConcourseResponse} from "./concourse-response-parser";
import * as request from 'request';
import nock = require("nock");
import {Util} from "./util";

const mockConcourseUrl = 'http://mock-concourse';

describe('ConcourseResponseParser', () => {
    afterEach(() => {
        nock.cleanAll();
    });
    describe('parseConcourseResponse', () => {
        it('returns a Promise resolving to the response', done => {
            nock(mockConcourseUrl)
                .get('/')
                .reply(200, {some:'content'});
            request.get(`${mockConcourseUrl}/`, async (err, response) => {
                const actualResponse = await ConcourseResponseParser.parseConcourseResponse(response);
                expect(actualResponse.response).toEqual(response);
                done();
            });
        });
        it('fills the csrf property of the response if a matching header is found', done => {
            const expectedCsrfToken = 'expected token value';
            nock(mockConcourseUrl)
                .get('/')
                .reply(200, {some:'content'}, {'X-Csrf-Token': expectedCsrfToken});
            request.get(`${mockConcourseUrl}/`, async (err, response) => {
                const actualResponse = await ConcourseResponseParser.parseConcourseResponse(response);
                expect(actualResponse.csrfToken).toEqual(expectedCsrfToken);
                done();
            });
        });
        it('does not crash if the csrf header value is an empty string', done => {
            nock(mockConcourseUrl)
                .get('/')
                .reply(200, {some:'content'}, {'X-Csrf-Token': ''});
            request.get(`${mockConcourseUrl}/`, async (err, response) => {
                await ConcourseResponseParser.parseConcourseResponse(response)
                    .catch(e => fail(e));
                done();
            });
        });
        it('fills the atcToken property of the response if a matching cookie is found', done => {
            const expectedAtcToken = 'Bearer expected token value';
            nock(mockConcourseUrl)
                .get('/')
                .reply(200, {some:'content'}, {'Set-Cookie': `ATC-Authorization="${expectedAtcToken}"`});
            request.get(`${mockConcourseUrl}/`, async (err, response) => {
                const actualResponse = await ConcourseResponseParser.parseConcourseResponse(response);
                expect(actualResponse.atcToken).toEqual(expectedAtcToken);
                done();
            });
        });
    });
});

describe('ParsedConcourseResponse', () => {
    let unitUnderTest: ParsedConcourseResponse;
    let mockResponse: request.Response;
    beforeEach(() => {
        mockResponse = jasmine.createSpyObj<request.Response>('request.Response', ['nothing']);
        unitUnderTest = new ParsedConcourseResponse(mockResponse);
    });
    describe('setCsrfToken', () => {
        it('calls Util.firstHeaderValue', () => {
            // given
            const expectedValue = 'expected value';
            spyOn(Util, 'firstHeaderValue')
                .and.callThrough();

            // when
            unitUnderTest.setCsrfToken(expectedValue);

            // then
            expect(Util.firstHeaderValue)
                .toHaveBeenCalledWith(expectedValue);
        });
        it('sets the csrfToken propery', () => {
            // given
            const expectedValue = 'expected value';

            // when
            unitUnderTest.setCsrfToken(expectedValue);

            // then
            expect(unitUnderTest.csrfToken).toEqual(expectedValue);
        });
    });
    describe('setAtcToken(value)', () => {
        it('does nothing if the value is undefined', () => {
            const expectedValue = 'expected value';
            // given
            const unexpectedValue = undefined;
            unitUnderTest.atcToken = expectedValue;

            // when
            unitUnderTest.setAtcToken(unexpectedValue);

            // then
            expect(unitUnderTest.atcToken).toEqual(expectedValue);
        });
        it('uses the value if it is a string', () => {
            const expectedValue = 'expected value';

            // given
            const stringValue = `ATC-Authorization="${expectedValue}"`;

            // when
            unitUnderTest.setAtcToken(stringValue);

            // then
            expect(unitUnderTest.atcToken).toEqual(expectedValue);
        });
        it('uses the last valid value if the value is an array', () => {
            const expectedValue = 'expected value';
            const unexpectedValue = 'unexpected value';

            // given
            const arrayValue = [
                `ATC-Authorization="${unexpectedValue}"`,
                'unexpected',
                'ATC-Authorization',
                `ATC-Authorization="${expectedValue}"`
            ];

            // when
            unitUnderTest.setAtcToken(arrayValue);

            // then
            expect(unitUnderTest.atcToken).toEqual(expectedValue);
        });
    });
});