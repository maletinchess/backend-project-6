import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  getTestData, prepareData, signIn, getEntityIdByData, makeApp, buildResponse,
} from './helpers/index.js';

describe('test labels CRUD', () => {
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

  it('should return 200 on GET labels', async () => {
    const response = await buildResponse(app, 'GET', 'labels', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('should return 200 on GET labelsNew', async () => {
    const response = await buildResponse(app, 'GET', 'labelsNew', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('should return 200 on GET labelsEdit', async () => {
    const labelToEditId = await getEntityIdByData(testData.labels.current, models.label);

    const response = await buildResponse(app, 'GET', 'labelsEdit', { cookies: cookie, paramsId: labelToEditId });

    expect(response.statusCode).toBe(200);
  });

  it('should create label', async () => {
    const data = testData.labels.new;
    const response = await buildResponse(app, 'POST', 'labelsCreate', { data, cookies: cookie });

    expect(response.statusCode).toBe(302);

    const createdLabel = await models.label.query().findOne({ name: data.name });
    expect(createdLabel).toMatchObject(data);
  });

  it('should update label', async () => {
    const labelToUpdateId = await getEntityIdByData(testData.labels.current, models.label);
    const data = testData.labels.toUpdate;

    const response = await buildResponse(app, 'PATCH', 'labelsUpdate', { cookies: cookie, data, paramsId: labelToUpdateId });

    expect(response.statusCode).toBe(302);

    const updatedLabel = await models.label.query().findById(labelToUpdateId);
    expect(updatedLabel).toMatchObject(data);
  });

  it('should delete label', async () => {
    const labelToDeleteId = await getEntityIdByData(testData.labels.toDelete, models.label);

    const response = await buildResponse(app, 'DELETE', 'labelsDelete', { cookies: cookie, paramsId: labelToDeleteId });

    expect(response.statusCode).toBe(302);
    const deletedLabel = await models.label.query().findById(labelToDeleteId);
    expect(deletedLabel).toBeUndefined();
  });

  it('should relate label with task', async () => {
    const { binded } = testData.labels;
    const bindedLabel = await models.label.query().findOne({ name: binded.name });
    const tasks = await bindedLabel.$relatedQuery('tasks');
    expect(tasks.length > 0).toBeTruthy();
  });

  it('should not delete label binded with tasks', async () => {
    const labelToDeleteId = await getEntityIdByData(testData.labels.binded, models.label);

    const response = await buildResponse(app, 'DELETE', 'labelsDelete', { cookies: cookie, paramsId: labelToDeleteId });

    expect(response.statusCode).toBe(302);
    const deletedLabel = await models.label.query().findById(labelToDeleteId);
    expect(deletedLabel).toBeDefined();
  });

  afterAll(async () => {
    await knex('labels').truncate();
    await app.close();
  });
});
