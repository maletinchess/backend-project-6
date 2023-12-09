import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData, getCookies } from './helpers/index.js';

describe('test statuses CRUD', () => {
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

    cookie = await getCookies(app, testData.users.existing);
  });

  it('statuses get', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statusesIndex'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('statuses get new status page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('statusesNew'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create new status', async () => {
    const params = testData.statuses.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statusesCreate'),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const createdSatus = await models.status.query().findOne({ name: params.name });
    expect(createdSatus).toMatchObject(params);
  });

  it('update status', async () => {
    const params = testData.statuses.toUpdate;
    const currentStatus = testData.statuses.current;
    const { id } = await models.status.query().findOne({ name: currentStatus.name });
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('statusesUpdate', { id }),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const updatedStatus = await models.status.query().findById(id);
    expect(updatedStatus).toMatchObject(params);
  });

  it('delete status', async () => {
    const currentStatus = testData.statuses.current;
    const { id } = await models.status.query().findOne({ name: currentStatus.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('statusesDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.status.query().findById(id);
    expect(deletedStatus).toBeUndefined();
  });

  afterEach(async () => {
    await knex('statuses').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
