import {Util} from "./util";

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