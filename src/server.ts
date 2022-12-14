import './util/module-alias';
import { Server } from '@overnightjs/core';
import { Application } from 'express';
import bodyParser from 'body-parser';
import { BeachesController } from './controllers/beaches';
import { ForecastController } from './controllers/forecast';
import { UsersController } from './controllers/users';
import * as database from '@src/database';
import logger from './logger';
import * as http from 'http';
import expressPino from 'express-pino-logger';
import cors from 'cors';

export class SetupServer extends Server {
  private server?: http.Server;

  constructor(private port = 3000) {
    super();
  }

  public async init(): Promise<void> {
    this.setupExpress();
    this.setupControllers();
    await this.databaseSetup();
  }

  private setupExpress(): void {
    this.app.use(bodyParser.json());
    this.app.use(expressPino({ logger }));
    this.app.use(cors({ origin: '*' }));
  }

  private setupControllers(): void {
    const beachesController = new BeachesController();
    const forecastController = new ForecastController();
    const usersController = new UsersController();
    this.addControllers([beachesController, forecastController, usersController]);
  }

  private async databaseSetup(): Promise<void> {
    await database.connect();
  }
  
  public start(): void {
    this.server = this.app.listen(this.port, () => {
      logger.info('Server listening on port: ' + this.port);
    });
  }

  public async close(): Promise<void> {
    await database.close();
    if (this.server) {
      await new Promise((resolve, reject) => {
        this.server?.close((err) => {
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      });
    }
  }

  public getApp(): Application {
    return this.app;
  }
}
