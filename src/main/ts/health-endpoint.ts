import {Service} from "typedi";
import {Router, Request, Response} from 'express';

@Service()
export class HealthEndpoint {
    readonly router: Router = Router();

    constructor() {
        this.router.get('/', (req: Request, res: Response) => res.send('OK\n'));
    }
}