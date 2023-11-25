import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test labels CRUD', () => {
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

    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: testData.users.existing,
      },
    });

    const [sessionCookie] = responseSignIn.cookies;
    const { name, value } = sessionCookie;
    cookie = { [name]: value };
  });

  it('labels get', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('labels'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('labels get new label page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newLabel'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('get edit label page', async () => {
    const { current } = testData.labels;
    const { id } = await models.label.query().findOne({ name: current.name });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editLabel', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create label', async () => {
    const params = testData.labels.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('createLabel'),
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
    const { current } = testData.labels;
    const { id } = await models.label.query().findOne({ name: current.name });
    const params = testData.labels.toUpdate;

    const response = await app.inject({
      method: 'POST',
      url: app.reverse('updateLabel', { id }),
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
    const { current } = testData.labels;
    const { id } = await models.label.query().findOne({ name: current.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteLabel', { id }),
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

  afterEach(async () => {
    await knex('labels').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
