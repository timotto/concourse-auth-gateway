import * as request from 'request';
import {Util} from "./util";
export class ConcourseResponseParser {
    public static parseConcourseResponse(response: request.Response): Promise<ParsedConcourseResponse> {
        const parsedResponse = new ParsedConcourseResponse(response);
        parsedResponse.setCsrfToken(response.headers['x-csrf-token']);
        parsedResponse.setAtcToken(response.headers['set-cookie']);
        return Promise.resolve(parsedResponse);
    }
}

export class ParsedConcourseResponse {
    public csrfToken?: string;
    public atcToken?: string;
    constructor(readonly response: request.Response) {

    }

    setCsrfToken(csrfTokenHeaderValue: string | string[] | undefined) {
        this.csrfToken = Util.firstHeaderValue(csrfTokenHeaderValue);
    }

    setAtcToken(setCookieHeaderValue: string | string[] | undefined) {
        if (setCookieHeaderValue === undefined) return;
        let cookies: string[];
        if (typeof setCookieHeaderValue === 'string') {
            cookies = [setCookieHeaderValue];
        } else {
            cookies = setCookieHeaderValue;
        }

        this.atcToken = cookies
            .map(str => {
                const d = str.indexOf('=');
                if (d === -1) return undefined;
                const key = str.substr(0, d);
                const value = str.substr(d + 1);
                return {key: key, value: value};
            })
            .filter(pair => pair !== undefined)
            .filter(pair => pair.key === 'ATC-Authorization')
            .map(pair => pair.value)
            .map(value => value.split('"')[1])
            .reduce((a, b) => b);
    }
}