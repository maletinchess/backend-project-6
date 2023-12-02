// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.cjs';
import {
  getTestData, prepareData, getCookies, getUserIdByData,
} from './helpers/index.js';

describe('test users CRUD', () => {
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

    // TODO: пока один раз перед тестами
    // тесты не должны зависеть друг от друга
    // перед каждым тестом выполняем миграции
    // и заполняем БД тестовыми данными
  });

  beforeEach(async () => {
    await knex.migrate.latest();
    await prepareData(app);
    cookie = await getCookies(app, testData.users.existing);
  });

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('users'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newUser'),
    });

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const params = testData.users.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('users'),
      payload: {
        data: params,
      },
    });

    expect(response.statusCode).toBe(302);
    const expected = {
      ..._.omit(params, 'password'),
      passwordDigest: encrypt(params.password),
    };
    const user = await models.user.query().findOne({ email: params.email });
    expect(user).toMatchObject(expected);
  });

  it('user update his profile', async () => {
    const existingUser = testData.users.existing;
    const params = testData.users.toUpdate;
    const user = await models.user.query().findOne({ email: existingUser.email });
    const { id } = user;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('updateUser', { id }),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const updatedUser = await models.user.query().findById(id);

    const expected = {
      ..._.omit(params, 'password'),
      passwordDigest: encrypt(params.password),
    };
    expect(updatedUser).toMatchObject(expected);
  });

  it('user can not delete his profile if he has tasks', async () => {
    const id = await getUserIdByData(testData.users.existing, models.user);

    const responseDelete = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id }),
      cookies: cookie,
    });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(id);
    expect(removedUser).toBeDefined();
  });

  it('user can delete his profile if he has not tasks', async () => {
    const id = await getUserIdByData(testData.users.userWithoutTasks, models.user);

    const newCookie = await getCookies(app, testData.users.userWithoutTasks);

    const responseDelete = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id }),
      cookies: newCookie,
    });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(id);
    expect(removedUser).toBeUndefined();
  });

  it('user can not delete another user profile', async () => {
    const id = await getUserIdByData(testData.users.userWithoutTasks, models.user);

    const responseDelete = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id }),
      cookies: cookie,
    });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(id);
    expect(removedUser).toBeDefined();
  });

  afterEach(async () => {
    // Пока Segmentation fault: 11
    // после каждого теста откатываем миграции
    // await knex.migrate.rollback();
    await knex('users').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
