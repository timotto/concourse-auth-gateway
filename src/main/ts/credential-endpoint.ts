import {Service} from "typedi";
import {Router, Request, Response} from 'express';
import {CredentialService} from "./credential-service";

@Service()
export class CredentialEndpoint {
    readonly router: Router = Router();

    constructor(private credentialService: CredentialService) {
        this.router.post('/token', this.handleTokenRequest.bind(this));
        this.router.post('/basic', this.handleBasicAuthRequest.bind(this));
    }

    public handleTokenRequest(req: Request, res: Response): Promise<Response> {
        return this.credentialService.saveAtcToken(req.body.concourseUrl, req.body.team, req.body.token)
            .then(() => res.sendStatus(200));
    }

    public handleBasicAuthRequest(req: Request, res: Response): Promise<Response> {
        return this.credentialService.requestAtcToken(req.body.concourseUrl, req.body.team, req.body.credentials)
            .then(token => token === undefined
                ? res.sendStatus(403)
                : this.credentialService.saveAuthenticationCredentials(req.body.concourseUrl, req.body.team, req.body.credentials)
                    .then(() => res.sendStatus(200)));
    }
}