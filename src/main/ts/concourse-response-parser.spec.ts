import {ConcourseResponseParser} from "./concourse-response-parser";
import * as request from 'request';
import nock = require("nock");

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
