import express, {Response, Request} from 'express';
import path, {dirname} from 'path';
import * as http from "node:http";
import pg, {ClientConfig} from 'pg'
import * as fs from "node:fs";
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const {Client} = pg;

class httpServer {
    public app: express.Application;
    private readonly port: number = 3000;
    private dbClient: pg.Client | undefined = undefined;

    constructor() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '..')));
        this.app.use(express.static(path.join(__dirname, '..', 'static')));
        this.app.use(express.static('public', {
            setHeaders: (res, path) => {
                if (path.endsWith('.js')) {
                    res.set('Content-Type', 'application/javascript');
                }
            }
        }));

        this.port = 3000;

        http.createServer(this.app).listen(this.port, () => {
            console.log(`Server started on port ${this.port}.\n http://localhost:${this.port}`);
        });
    }

    public async dbConnect(config: ClientConfig) {
        try {
            this.dbClient = new Client(config);
            await this.dbClient.connect();
        } catch (e) {
            console.error(e);
        }
    }

    public async dbExecute(sql: string, commit: boolean, values?: string[]): Promise<pg.QueryResult> {
        if (this.dbClient) {
            try {
                await this.dbClient.query('BEGIN');
                const result = this.dbClient.query(sql, values);
                if (commit) {
                    await this.dbClient.query('COMMIT');
                }
                return result;
            } catch (e) {
                await this.dbClient.query('ROLLBACK');
                console.error(e);
            }
        }
        throw new Error('Not connected to DB');
    }
}

try {
    const server = new httpServer();
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'pg.json')).toString());
    await server.dbConnect(config);

    server.app.get('/', (req, res) => {
        res.sendFile(path.resolve('static/html/index.html'));
    });

    server.app.get('/allMasters', async (req, res) => {
        try {
            const sql = 'SELECT * from public.master';
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.post('/master', async (req, res) => {
        try {
            const {id, applicationId} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            let sql: string;
            if (applicationId) {
                const application = body.application;
                if (application.remove) {
                    sql = `DELETE FROM public.application WHERE id = '${applicationId}'`;
                } else {
                    sql = `INSERT INTO public.application (id, address, complexity) `
                        + `VALUES ('${application.id}', '${application.address}', ${application.complexity})`;
                }
                await server.dbExecute(sql, false);
            }
            const set =
                [(body.itemId
                    ? (body.remove
                        ? `applications = array_remove(applications, '${body.itemId}')`
                        : `applications = array_append(applications, '${body.itemId}')`)
                    : '')
                , (body.fullname
                    ? `fullname = '${body.fullname}'`
                    : '')];
            sql = `UPDATE public.master `
                + `SET `
                + set.filter(value => value.length > 0).join(', ') + ' '
                +`WHERE id = '${id}' `
                + (body.itemId
                    ? (body.remove
                        ? `AND '${body.itemId}' = ANY(applications)`
                        : `AND '${body.itemId}' != ALL(applications)`)
                    : '')
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.put('/master', async (req, res) => {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const sql = `INSERT INTO public.master (id, fullname) `
                + `VALUES ('${body.id}', '${body.fullname}')`
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.delete('/master', async (req, res) => {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            let sql = 'SELECT applications FROM public.master '
                + `WHERE id = '${id}'`;
            const applications: string[] = (await server.dbExecute(sql, true)).rows[0].applications;
            if (applications.length > 0) {
                sql = `DELETE FROM public.application `
                    + `WHERE id IN (${applications.map(application => `'${application}'`).join(', ')})`;
                console.log(sql);
                await server.dbExecute(sql, false);
            }
            sql = `DELETE FROM public.master `
                + `WHERE id = '${id}'`
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    server.app.get('/application', async (req, res) => {
        try {
            const {id} = req.query;
            const sql = `SELECT * FROM public.application `
                + (id
                    ? `WHERE id = '${id}' `
                    : '');
            const queryResult = await server.dbExecute(sql, true);
            res.status(200).send(queryResult.rows);
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

    async function postApplication(req: Request, res: Response) {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const set = [(body.address
                ? `address = '${body.address}' `
                : '')
            , (body.complexity
                ? `complexity = '${body.complexity}'`
                : '')];
            const sql = 'UPDATE public.application '
                + 'SET '
                + set.filter(value => value.length > 0).join(', ') + ' '
                + `WHERE id = '${id}'`
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    }

    server.app.post('/application', postApplication);

    async function putApplication(req: Request, res: Response) {
        try {
            const body = req.body;
            if (Object.keys(body).length === 0) {
                throw new Error('Empty body');
            }
            const sql = `INSERT INTO public.application (id, address, complexity) `
                + `VALUES ('${body.id}', '${body.address}', '${body.complexity}')`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    }

    server.app.put('/application', putApplication);

    server.app.delete('/application', async (req, res) => {
        try {
            const {id} = req.query;
            if (!id) {
                throw new Error('Empty id');
            }
            const sql = `DELETE FROM public.application WHERE id = '${id}'`;
            await server.dbExecute(sql, true);
            res.status(200).send();
        } catch (e) {
            console.error(e);
            res.status(400).send(e);
        }
    });

} catch (e) {
    console.error(e);
}
