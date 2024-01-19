// @ts-check

import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import encrypt from '../server/lib/secure.cjs';

import {
  getTestData, prepareData, signIn, getUserIdByData, makeApp, buildResponse,
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
    await knex.migrate.latest();
    await prepareData(app);
    models = app.objection.models;
  });

  beforeEach(async () => {
    cookie = await signIn(app, app.reverse('session'), testData.users.existing);
  });

  it('should return 200 on GET users', async () => {
    const response = await buildResponse(app, 'GET', 'usersIndex');

    expect(response.statusCode).toBe(200);
  });

  it('should return 200 on GET usersNew', async () => {
    const response = await buildResponse(app, 'GET', 'usersNew');

    expect(response.statusCode).toBe(200);
  });

  it('should create user on POST usersCreate', async () => {
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

  it('should update user profile on POST updateUsers', async () => {
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

  it('should not delete user\'s profile if he has tasks', async () => {
    const userToDeleteId = await getUserIdByData(testData.users.userWithTasksToDelete, models.user);

    const responseDelete = await buildResponse(app, 'DELETE', 'usersDelete', { cookies: cookie, paramsId: userToDeleteId });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(userToDeleteId);
    expect(removedUser).toBeDefined();
  });

  it('should delete user\'s profile if he has not tasks', async () => {
    const userToDeleteId = await getUserIdByData(testData.users.userWithoutTasks, models.user);

    const { anotherUserWithoutTasks } = testData.users;
    await console.log(encrypt(anotherUserWithoutTasks.password));

    const newCookie = await signIn(app, app.reverse('session'), testData.users.userWithoutTasks);

    const responseDelete = await buildResponse(app, 'DELETE', 'usersDelete', { cookies: newCookie, paramsId: userToDeleteId });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(userToDeleteId);
    expect(removedUser).toBeUndefined();
  });

  it('user should not delete another user profile', async () => {
    const userToDeleteId = await getUserIdByData(
      testData.users.anotherUserWithoutTasks,
      models.user,
    );

    const responseDelete = await buildResponse(app, 'DELETE', 'usersDelete', { cookies: cookie, paramsId: userToDeleteId });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(userToDeleteId);
    expect(removedUser).toBeDefined();
  });

  afterAll(async () => {
    await knex('users').truncate();
    await app.close();
  });
});
