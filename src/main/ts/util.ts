import * as request from 'request';

export class Util {
    public static firstHeaderValue(headerValue: string | string[] | undefined): string | undefined {
        if (headerValue === undefined) return undefined;
        if (typeof headerValue === 'string') return headerValue;
        if (headerValue.length === 0) return undefined;
        return headerValue.filter(value => value !== undefined)[0];
    }

    public static rpGet(url: string, headers?: any): Promise<request.Response> {
        return new Promise<request.Response>(((resolve, reject) => {
            request.get(url,
                headers!==undefined?{headers: headers}:undefined,
                (err, response: request.Response) =>
                    err
                        ?reject(err)
                        :resolve(response));
        }));
    }
    public static uniqueById(a: any[], b: any[]): any[] {
        const result = [].concat(...a);
        const onlyInBItems = b
            .filter(item => a
                .filter(aItem => aItem.id === item.id).length === 0);
        return result.concat(...onlyInBItems);
    }
}