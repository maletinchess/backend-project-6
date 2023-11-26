// @ts-check

import fastify from 'fastify';
import encrypt from '../server/lib/secure.cjs';

import init from '../server/plugin.js';
import { getTestData, prepareData, getCookies } from './helpers/index.js';

describe('delete user - corner cases', () => {
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
    cookie = await getCookies(app, testData.users.userWithoutTasks);
  });

  it('user CAN delete his profile if he has NOT tasks', async () => {
    const { userWithoutTasks } = testData.users;
    const user = await models.user.query().findOne({ email: userWithoutTasks.email });
    await console.log(userWithoutTasks.password, encrypt(userWithoutTasks.password), user.passwordDigest, 'PASSWORDS');
    const { id } = user;

    const responseDelete = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteUser', { id }),
      cookies: cookie,
    });

    expect(responseDelete.statusCode).toBe(302);

    const removedUser = await models.user.query().findById(id);
    expect(removedUser).toBeUndefined();
  });

  it('user CAN NOT delete ANOTHER USER', async () => {
    const existingUserData = testData.users.existing;
    const { id } = await models.user.query().findOne({ email: existingUserData.email });

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
