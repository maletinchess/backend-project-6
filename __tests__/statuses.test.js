import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  getTestData, prepareData, signIn, makeApp, buildResponse, getEntityIdByData,
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
    await knex.migrate.latest();
    await prepareData(app);
    models = app.objection.models;
  });

  beforeEach(async () => {
    cookie = await signIn(app, app.reverse('session'), testData.users.existing);
  });

  it('should return 200 on GET statuses', async () => {
    const response = await buildResponse(app, 'GET', 'statuses', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('should return 200 on GET statusesNew', async () => {
    const response = await buildResponse(app, 'GET', 'statusesNew', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('should create new status on POST statusesCreate', async () => {
    const data = testData.statuses.new;
    const response = await buildResponse(app, 'POST', 'statusesCreate', { data, cookies: cookie });

    expect(response.statusCode).toBe(302);

    const createdSatus = await models.status.query().findOne({ name: data.name });
    expect(createdSatus).toMatchObject(data);
  });

  it('should update status on PATCH statusesUpdate', async () => {
    const data = testData.statuses.toUpdate;
    const currentStatus = testData.statuses.current;

    const statusToUpdateId = await getEntityIdByData(currentStatus, models.status);

    const response = await buildResponse(app, 'PATCH', 'statusesUpdate', { paramsId: statusToUpdateId, data, cookies: cookie });

    expect(response.statusCode).toBe(302);

    const updatedStatus = await models.status.query().findById(statusToUpdateId);
    expect(updatedStatus).toMatchObject(data);
  });

  it('should delete status on DELETE statusesDelete', async () => {
    const { statusToDelete } = testData.statuses;
    const statusToDeleteId = await getEntityIdByData(statusToDelete, models.status);

    const response = await buildResponse(app, 'DELETE', 'statusesDelete', { paramsId: statusToDeleteId, cookies: cookie });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.status.query().findById(statusToDeleteId);
    expect(deletedStatus).toBeUndefined();
  });

  it('should not delete status connected with task', async () => {
    const statusToDelete = testData.statuses.statusConnectedWithTask;

    const statusToDeleteId = await getEntityIdByData(statusToDelete, models.status);

    const response = await buildResponse(app, 'DELETE', 'statusesDelete', { cookies: cookie, paramsId: statusToDeleteId });

    expect(response.statusCode).toBe(302);

    const deletedStatus = await models.status.query().findById(statusToDeleteId);
    expect(deletedStatus).toBeDefined();
  });

  afterAll(async () => {
    await knex('statuses').truncate();
    await app.close();
  });
});
