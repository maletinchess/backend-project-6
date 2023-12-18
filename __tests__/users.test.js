// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.cjs';
import {
  getTestData, prepareData, getCookies, getUserIdByData, makeApp, buildResponse,
} from './helpers/index.js';

describe('test users CRUD', () => {
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
    const response = await buildResponse(app, 'GET', 'usersIndex');

    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await buildResponse(app, 'GET', 'usersNew');

    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const data = testData.users.new;

    const response = await buildResponse(app, 'POST', 'usersCreate', { data });

    expect(response.statusCode).toBe(302);
    const expected = {
      ..._.omit(data, 'password'),
      passwordDigest: encrypt(data.password),
    };
    const user = await models.user.query().findOne({ email: data.email });
    expect(user).toMatchObject(expected);
  });

  it('user update his profile', async () => {
    const existingUser = testData.users.existing;
    const data = testData.users.toUpdate;
    const userToUpdateId = await getUserIdByData(existingUser, models.user);

    const response = await buildResponse(app, 'POST', 'usersUpdate', { data, cookies: cookie, paramsId: userToUpdateId });

    expect(response.statusCode).toBe(302);

    const updatedUser = await models.user.query().findById(userToUpdateId);

    const expected = {
      ..._.omit(data, 'password'),
      passwordDigest: encrypt(data.password),
    };
    expect(updatedUser).toMatchObject(expected);
  });

  it('user can not delete his profile if he has tasks', async () => {
    const userToDeleteId = await getUserIdByData(testData.users.existing, models.user);

    const responseDelete = await buildResponse(app, 'DELETE', 'usersDelete', { cookies: cookie, paramsId: userToDeleteId });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(userToDeleteId);
    expect(removedUser).toBeDefined();
  });

  it('user can delete his profile if he has not tasks', async () => {
    const userToDeleteId = await getUserIdByData(testData.users.userWithoutTasks, models.user);

    const newCookie = await getCookies(app, testData.users.userWithoutTasks);

    const responseDelete = await buildResponse(app, 'DELETE', 'usersDelete', { cookies: newCookie, paramsId: userToDeleteId });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(userToDeleteId);
    expect(removedUser).toBeUndefined();
  });

  it('user can not delete another user profile', async () => {
    const userToDeleteId = await getUserIdByData(testData.users.userWithoutTasks, models.user);

    const responseDelete = await buildResponse(app, 'DELETE', 'usersDelete', { cookies: cookie, paramsId: userToDeleteId });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(userToDeleteId);
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
