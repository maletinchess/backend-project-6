import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  getTestData, prepareData, getCookies, makeApp, buildResponse, getEntityIdByData,
} from './helpers/index.js';

describe('test statuses CRUD', () => {
  let app;
  let knex;
  let models;
  let cookie;
  const testData = getTestData();

  beforeAll(async () => {
    app = makeApp(fastify);
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
    const response = await buildResponse(app, 'GET', 'statusesIndex', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('statuses get new status page', async () => {
    const response = await buildResponse(app, 'GET', 'statusesNew', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('create new status', async () => {
    const data = testData.statuses.new;
    const response = await buildResponse(app, 'POST', 'statusesCreate', { data, cookies: cookie });

    expect(response.statusCode).toBe(302);

    const createdSatus = await models.status.query().findOne({ name: data.name });
    expect(createdSatus).toMatchObject(data);
  });

  it('update status', async () => {
    const data = testData.statuses.toUpdate;
    const currentStatus = testData.statuses.current;

    const statusToUpdateId = await getEntityIdByData(currentStatus, models.status);

    const response = await buildResponse(app, 'POST', 'statusesUpdate', { paramsId: statusToUpdateId, data, cookies: cookie });

    expect(response.statusCode).toBe(302);

    const updatedStatus = await models.status.query().findById(statusToUpdateId);
    expect(updatedStatus).toMatchObject(data);
  });

  it('delete status', async () => {
    const currentStatus = testData.statuses.current;
    const statusToDeleteId = await getEntityIdByData(currentStatus, models.status);

    const response = await buildResponse(app, 'DELETE', 'statusesDelete', { paramsId: statusToDeleteId, cookies: cookie });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.status.query().findById(statusToDeleteId);
    expect(deletedStatus).toBeUndefined();
  });

  it('can not delete status connected with task', async () => {
    const statusToDelete = testData.statuses.statusConnectedWithTask;

    const statusToDeleteId = await getEntityIdByData(statusToDelete, models.status);

    const response = await buildResponse(app, 'DELETE', 'statusesDelete', { cookies: cookie, paramsId: statusToDeleteId });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.status.query().findById(statusToDeleteId);
    expect(deletedStatus).toBeDefined();
  });

  afterEach(async () => {
    await knex('statuses').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
