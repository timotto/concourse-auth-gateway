import {Service} from 'typedi';
import * as request from "request";

@Service()
export class HttpClient {
    public get(url: string, headers?: any): Promise<HttpResponse> {
        return new Promise<HttpResponse>(((resolve, reject) => {
            request.get(url,
                headers!==undefined?{headers: headers}:undefined,
                (err, response: request.Response) =>
                    err
                        ?reject(err)
                        :resolve(HttpResponse.fromRequestResponse(response)));
        }));
    }
}

export class HttpResponse {
    public statusCode: number;
    public statusMessage: string;
    public body?: string;
    public headers?: any;

    public static fromRequestResponse(response: request.Response): HttpResponse {
        if (response === undefined) return undefined;
        const httpResponse = new HttpResponse();
        httpResponse.statusCode = response.statusCode;
        httpResponse.statusMessage = response.statusMessage;
        httpResponse.body = response.body;
        httpResponse.headers = response.headers;
        return httpResponse;
    }
}