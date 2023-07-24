// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.cjs';
import { getTestData, prepareData } from './helpers/index.js';
import session from '../server/routes/session.js';

describe('test users CRUD', () => {
  let app;
  let knex;
  let models;
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
    await knex.migrate.latest();
    await prepareData(app);
  });

  beforeEach(async () => {
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

  it('update', async () => {
    const params = testData.users.existing;
    const newParams = testData.users.toUpdate;
    const user = await models.user.query().findOne({ email: params.email });
    const { id } = user;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('updateUser', { id }),
      payload: {
        data: newParams,
      },
    });

    expect(response.statusCode).toBe(302);

    const updatedUser = await models.user.query().findById(id);

    const expected = {
      ..._.omit(newParams, 'password'),
      passwordDigest: encrypt(newParams.password),
    }
    expect(updatedUser).toMatchObject(expected);
  });

  it('delete', async () => {
    const userToDeleteData = testData.users.toDelete;
    await console.log(userToDeleteData, 'to delete PARAMS');
    const user = await models.user.query().findOne({ email: userToDeleteData.email });
    const users = await models.user.query();
    await console.log(users, 'DATABASE');
    const { id } = user;

    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: userToDeleteData,
      },
    });

    expect(responseSignIn.statusCode).toBe(200);

    const [sessionCookie] = responseSignIn.cookies;
    await console.log(responseSignIn.cookies);
    const { name, value } = sessionCookie;
    const cookie = { [name]: value };

    const responseDelete = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id }),
      cookies: cookie,
    });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(id);
    expect(removedUser).toBeUndefined();
  });

  afterEach(async () => {
    // Пока Segmentation fault: 11
    // после каждого теста откатываем миграции
    // await knex.migrate.rollback();
  });

  afterAll(async () => {
    await app.close();
  });
});
