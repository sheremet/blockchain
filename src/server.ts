import * as env from 'node-env-file';
import * as fs from 'fs';

if (fs.existsSync(process.cwd() + '/.env')) {
  env(process.cwd() + '/.env');
}
import * as path from 'path';
import {ExpressConfig} from './middleware/server-config/Express';
import {logger} from './middleware/common/logging';
import './service-layer/controllers';
import {RegisterRoutes} from './middleware/server-config/routes';
import * as methodOverride from 'method-override';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import * as health from 'express-ping';
import './types';
import * as config from 'config';

import {swaggerConfig} from './shared/swaggerConfigure';

const swaggerFilePath = path.resolve(process.cwd() + '/dist/swagger.json');
swaggerConfig(swaggerFilePath);

const express = new ExpressConfig();
const port = config.get('express.port');
const expressHost = config.get('express.host');
const debugPort = config.get('express.debug');

express.app.use('/docs', express.static(__dirname + '/swagger-ui'));
express.app.use('/swagger.json', (req, res) => {
  res.sendFile(swaggerFilePath);
});
express.app.use(cors());
express.app.use(bodyParser.urlencoded({extended: true}));
express.app.use(bodyParser.json());
express.app.use(cookieParser());
express.app.use(methodOverride());
express.app.use(health.ping());

RegisterRoutes(express.app);

function clientErrorHandler(err, req, res, next) {
  if (err.hasOwnProperty('thrown') && err.thrown) {
    res.status(err.status).send({error: err.message});
  } else {

    next(err);
  }
}

express.app.use(clientErrorHandler);

this.server = express.app.listen(port, () => {

  logger.info('expressHost', expressHost);
  const expressPort = +this.server.address().port;
  logger.info(`
    ------------
    Server Started!
    Express: http://${expressHost}:${expressPort}
    Debugger: http:/${expressHost}:${expressPort}/?ws=${expressHost}:${expressPort}&port=${debugPort}
    
    
    Health: http://${expressHost}:${expressPort}/ping
    Swagger Docs: http://${expressHost}:${expressPort}/docs
    Swagger Spec: http://${expressHost}:${expressPort}/swagger.json
    ------------
  `);
});
