import {Util} from "./util";
import * as request from 'request';
import any = jasmine.any;

describe('Util', () => {
    describe('firstHeaderValue', () => {
        it('returns undefined if the headerValue is undefined', () =>
            expect(Util.firstHeaderValue(undefined)).toBeUndefined()
        );
        it('returns the value if it is a string', () => {
            const expectedValue = 'a string';

            expect(Util.firstHeaderValue(expectedValue)).toEqual(expectedValue);
        });
        it('returns undefined if the value is an empty array', () =>
            expect(Util.firstHeaderValue([])).toBeUndefined()
        );
        it('returns the first value that is not undefined if the value is an array', () => {
            const expectedValue = 'expected value';
            const unexpectedValue = 'unexpected value';
            const fixture = [undefined, undefined, expectedValue, undefined, unexpectedValue];

            expect(Util.firstHeaderValue(fixture)).toEqual(expectedValue);
        });
    });
    describe('rpGet', () => {
        it('calls request.get with proper CoreOptions if headers are defined', async () => {
            const definedUrl = 'defined url';
            spyOn(request, 'get')
                .and.callFake((url,o,cb) => cb());

            // given
            const givenHeaders: any = {'some':'header'};

            // when
            await Util.rpGet(definedUrl, givenHeaders);

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
            await Util.rpGet(definedUrl, givenHeaders);

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
            await Util.rpGet(expectedUrl, undefined);

            // then
            expect(request.get).toHaveBeenCalledWith(expectedUrl, expectedHeaders, any(Function));

            (request.get as jasmine.Spy).calls.reset();

            // given
            expectedHeaders = definedHeaders;

            // when
            await Util.rpGet(expectedUrl, definedHeaders);

            // then
            expect(request.get).toHaveBeenCalledWith(expectedUrl, {headers: expectedHeaders}, any(Function));
        });
        it('resolves the promise with the response of the request', async () => {
            // given
            const mockResponse = jasmine.createSpyObj<request.Response>('request.Response', ['nothing']);
            spyOn(request, 'get')
                .and.callFake((url,o,cb) => cb(undefined, mockResponse));

            // when
            const actualResponse = await Util.rpGet('something', undefined);

            //then
            expect(actualResponse).toEqual(mockResponse);
        });
        it('rejects the promise with reason if there was an error', async () => {
            // given
            const expectedReason = 'some reason';
            spyOn(request, 'get')
                .and.callFake((url,o,cb) => cb(expectedReason));

            // when
            await Util.rpGet('something', undefined)
                .then(() => fail())
                //then
                .catch(error => expect(error).toBe(expectedReason));
        });
    });
    describe('uniqueById(a,b)', () => {
        it('returns all items in a', () => {
            // given
            const sameId = 3;
            const differentXinA = 1;
            const differentXinB = 2;
            const a = [{id:1},{id:2},{id:sameId,x:differentXinA}];
            const b = [{id:4},{id:5},{id:sameId,x:differentXinB}];

            // when
            const actualResult = Util.uniqueById(a, b);

            // then
            a.forEach(x => expect(actualResult).toContain(x));
        });
        it('returns all items from b unless there already is an item with the same id', () => {
            // given
            const sameId = 3;
            const differentXinA = 1;
            const differentXinB = 2;
            const a = [{id:1},{id:2},{id:sameId,x:differentXinA}];
            const uniqueInB = {id:4};
            const uniqueInBAlso = {id:5};
            const b = [uniqueInB,uniqueInBAlso,{id:sameId,x:differentXinB}];

            // when
            const actualResult = Util.uniqueById(a, b);

            // then
            expect(actualResult).toContain(uniqueInB);
            expect(actualResult).toContain(uniqueInBAlso);
            expect(actualResult).not.toContain({id:sameId,x:differentXinB});
        });
    });
});