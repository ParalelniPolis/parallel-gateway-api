/**
 * Module dependencies.
 */
import express from 'express';
import compression from 'compression';
import session from 'express-session';
import errorHandler from 'api-error-handler';
import chalk from 'chalk';
import logger from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import Pusher from 'pusher-js';

/**
 * Import models
 */
import models from './models/index';

/**
 * Import routes
 */
import * as apiOrder from './api/v1/order';
import * as apiGateway from './api/v1/gateway';

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.load({ silent: true });

/**
 * Connect to DB.
 */
models.sequelize.authenticate()
  .then(() => {
    console.log('%s Successfully connected to the DB', chalk.green('✓'));

    models.sequelize.sync().then(() => {
      console.log('%s Successfully synced the DB models', chalk.green('✓'));
    }).catch((error) => {
      console.log('%s DB synchronization failed: %s', chalk.red('✗'), error);
      process.exit();
    });
  })
  .catch((error) => {
    console.log('%s Unable to connect to the DB: %s', chalk.red('✗'), error);
    process.exit();
  });

/**
 * Create Express server.
 */
const app = express();

app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
}));
app.use(cors);

// create the pusher client connection
const pusher = new Pusher('e9f5cc20074501ca7395', {
  wsHost: 'slanger1.chain.so',
  wsPort: 443,
  wssPort: 443,
  encrypted: true,
  disabledTransports: ['sockjs'],
  disableStats: true,
  cluster: 'mt1',
});

pusher.connection.bind('error', (err) => {
  console.error(err);
  process.exit();
});

pusher.connection.bind('disconnected', () => {
  console.log('Pusher disconnected');
  process.exit();
});

app.set('pusher', pusher);

app.get('/v1/gateway/:gatewayId', apiGateway.getGateway);
app.post('/v1/order/', apiOrder.setOrder);
app.get('/v1/order/:orderId', apiOrder.getOrder);

/**
 * Error Handler.
 */
app.use(errorHandler());

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
  console.log('  Press CTRL-C to stop\n');
});

export default app;
