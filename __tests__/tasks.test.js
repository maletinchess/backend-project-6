import _ from 'lodash';
import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test tasks CRUD', () => {
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

  it('tasks', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('get new task page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('newTask'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('get edit-task page', async () => {
    const { current } = testData.tasks;
    const { id } = await models.task.query().findOne({ name: current.name });

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('editTask', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create task', async () => {
    const params = testData.tasks.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('createTask'),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const createdTask = await models.task.query().findOne({ name: params.name });
    expect(createdTask).toMatchObject(params);
  });

  it('create task with label', async () => {
    const params = testData.tasks.withLabel;
    await console.log(params);
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('createTask'),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const createdTask = await models.task.query().findOne({ name: params.name });
    await console.log(createdTask);
    const bindedLabels = await createdTask.$relatedQuery('labels');
    await console.log(bindedLabels);
    expect(bindedLabels.length).toBeGreaterThan(0);
  });

  it('update task - status, description, name', async () => {
    const { current } = testData.tasks;
    const taskBeforeUpdate = await models.task.query().findOne({ name: current.name });
    await console.log(taskBeforeUpdate);
    const { id } = taskBeforeUpdate;
    const params = testData.tasks.toUpdate;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateTask', { id }),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const updatedTask = await models.task.query().findById(id);
    await console.log(updatedTask);
    expect(updatedTask).toMatchObject(params);
  });

  it('update task - labels', async () => {
    const { current } = testData.tasks;
    const taskBeforeUpdate = await models.task.query().findOne({ name: current.name });
    await console.log(taskBeforeUpdate);
    const { id } = taskBeforeUpdate;
    const params = testData.tasks.toUpdate;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('updateTask', { id }),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const updatedTask = await models.task.query().findById(id);
    await console.log(updatedTask);
    expect(updatedTask).toMatchObject(params);
  });

  it('user can not delete task with anotother creator', async () => {
    const { current } = testData.tasks;
    const { id } = await models.task.query().findOne({ name: current.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteTask', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const deletedTask = await models.task.query().findById(id);
    expect(deletedTask).toBeDefined();
  });

  it('user can delete task if he is creator', async () => {
    const { taskToDelete } = testData.tasks;
    const { id } = await models.task.query().findOne({ name: taskToDelete.name });

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('deleteTask', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);
    const deletedTask = await models.task.query().findById(id);
    expect(deletedTask).toBeUndefined();
  });

  afterEach(async () => {
    await knex('tasks').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
