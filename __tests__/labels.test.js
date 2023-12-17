import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  getTestData, prepareData, getCookies, getEntityIdByData, makeApp,
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
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labelsIndex'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('labels get new label page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labelsNew'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('get edit label page', async () => {
    const id = await getEntityIdByData(testData.labels.current, models.label);

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labelsEdit', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create label', async () => {
    const params = testData.labels.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labelsCreate'),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const createdLabel = await models.label.query().findOne({ name: params.name });
    expect(createdLabel).toMatchObject(params);
  });

  it('update label', async () => {
    const id = await getEntityIdByData(testData.labels.current, models.label);
    const params = testData.labels.toUpdate;

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('labelsUpdate', { id }),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const updatedLabel = await models.label.query().findById(id);
    expect(updatedLabel).toMatchObject(params);
  });

  it('delete label', async () => {
    const id = await getEntityIdByData(testData.labels.current, models.label);

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('labelsDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const deletedLabel = await models.label.query().findById(id);
    expect(deletedLabel).toBeUndefined();
  });

  it('label binded with task', async () => {
    const { binded } = testData.labels;
    const bindedLabel = await models.label.query().findOne({ name: binded.name });
    const tasks = await bindedLabel.$relatedQuery('tasks');
    expect(tasks.length > 0).toBeTruthy();
  });

  it('can not delete label binded with tasks', async () => {
    const id = await getEntityIdByData(testData.labels.binded, models.label);

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('labelsDelete', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const deletedLabel = await models.label.query().findById(id);
    expect(deletedLabel).toBeDefined();
  });

  afterEach(async () => {
    await knex('labels').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
