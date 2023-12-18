import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  getTestData, prepareData, getCookies, getEntityIdByData, makeApp, buildResponse,
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
    models = app.objection.models;
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);

    cookie = await getCookies(app, testData.users.existing);
  });

  it('labels get', async () => {
    const response = await buildResponse(app, 'GET', 'labelsIndex', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('labels get new label page', async () => {
    const response = await buildResponse(app, 'GET', 'labelsNew', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('get edit label page', async () => {
    const labelToEditId = await getEntityIdByData(testData.labels.current, models.label);

    const response = await buildResponse(app, 'GET', 'labelsEdit', { cookies: cookie, paramsId: labelToEditId });

    expect(response.statusCode).toBe(200);
  });

  it('create label', async () => {
    const data = testData.labels.new;
    const response = await buildResponse(app, 'POST', 'labelsCreate', { data, cookies: cookie });

    expect(response.statusCode).toBe(302);

    const createdLabel = await models.label.query().findOne({ name: data.name });
    expect(createdLabel).toMatchObject(data);
  });

  it('update label', async () => {
    const labelToUpdateId = await getEntityIdByData(testData.labels.current, models.label);
    const data = testData.labels.toUpdate;

    const response = await buildResponse(app, 'POST', 'labelsUpdate', { cookies: cookie, data, paramsId: labelToUpdateId });

    expect(response.statusCode).toBe(302);

    const updatedLabel = await models.label.query().findById(labelToUpdateId);
    expect(updatedLabel).toMatchObject(data);
  });

  it('delete label', async () => {
    const labelToDeleteId = await getEntityIdByData(testData.labels.current, models.label);

    const response = await buildResponse(app, 'DELETE', 'labelsDelete', { cookies: cookie, paramsId: labelToDeleteId });

    expect(response.statusCode).toBe(302);
    const deletedLabel = await models.label.query().findById(labelToDeleteId);
    expect(deletedLabel).toBeUndefined();
  });

  it('label binded with task', async () => {
    const { binded } = testData.labels;
    const bindedLabel = await models.label.query().findOne({ name: binded.name });
    const tasks = await bindedLabel.$relatedQuery('tasks');
    expect(tasks.length > 0).toBeTruthy();
  });

  it('can not delete label binded with tasks', async () => {
    const labelToDeleteId = await getEntityIdByData(testData.labels.binded, models.label);

    const response = await buildResponse(app, 'DELETE', 'labelsDelete', { cookies: cookie, paramsId: labelToDeleteId });

    expect(response.statusCode).toBe(302);
    const deletedLabel = await models.label.query().findById(labelToDeleteId);
    expect(deletedLabel).toBeDefined();
  });

  afterEach(async () => {
    await knex('labels').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
