import fastify from 'fastify';

import init from '../server/plugin.js';
import { getTestData, prepareData, getCookies } from './helpers/index.js';

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
    cookie = await getCookies(app, testData.users.existing);
  });

  it('tasks', async () => {
    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasks'),
      cookies: cookie,
      query: {
        label: '3',
      },
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

  it('create task with labels', async () => {
    const params = testData.tasks.newTaskWithLabels;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('createTask'),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const taskWithoutGraph = await models.task.query().findOne({ name: params.name });
    await console.log(taskWithoutGraph);
    const { id } = taskWithoutGraph;
    const createdTaskWithGraph = await models.task.query().findById(id).withGraphJoined('[labels, creator, status]');
    await console.log(createdTaskWithGraph);

    const label = await models.label.query().findById(1);
    const relatedTasks = await label.$relatedQuery('tasks');
    await console.log(relatedTasks);
    const expectedCreatorId = 2;
    const expectedStatusId = 1;
    const expectedLabelsLength = 3;
    const actualCreatorId = createdTaskWithGraph.creator.id;
    const actualStatusId = createdTaskWithGraph.status.id;
    const actualLabelsLength = createdTaskWithGraph.labels.length;

    expect(actualCreatorId).toEqual(expectedCreatorId);
    expect(actualStatusId).toEqual(expectedStatusId);
    expect(actualLabelsLength).toEqual(expectedLabelsLength);
    expect(relatedTasks).toContainEqual(taskWithoutGraph);
  });

  it('update task - status, description, name', async () => {
    const { current } = testData.tasks;
    const taskBeforeUpdate = await models.task.query().findOne({ name: current.name });
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
    expect(updatedTask).toMatchObject(params);
  });

  it('user can delete task if he is creator', async () => {
    const { taskToDelete } = testData.tasks;
    const task = await models.task.query().findOne({ name: taskToDelete.name });
    const { id } = task;

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
