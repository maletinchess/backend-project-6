import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.cjs';
import { getTestData, prepareData } from './helpers/index.js';

describe('test stattuses CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({
      exposeHeadRoutes: false,
      logger: { target: 'pino-pretty' },
    });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
  });

  it('statuses get', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statuses'),
    });
  
    expect(response.statusCode).toBe(200);
  });

  it('statuses get new status page', async () => {
    const params = testData.statuses.new;
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('getNewStatusPage'),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);

    const status = await models.status.query().findOne({ name: params.name });
    expect(status).toMatchObject(params);
  });

  it('create new status', async () => {
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('creteNewStatus'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
  });

  afterEach(async () => {
    await knex('statuses').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});