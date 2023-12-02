import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  getTestData, prepareData, getCookies, getEntityIdByData,
} from './helpers/index.js';

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
      url: app.reverse('tasksIndex'),
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
      url: app.reverse('tasksNew'),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('get edit-task page', async () => {
    const id = await getEntityIdByData(testData.tasks.current, models.task);

    const response = await app.inject({
      method: 'GET',
      url: app.reverse('tasksEdit', { id }),
      cookies: cookie,
    });

    expect(response.statusCode).toBe(200);
  });

  it('create task', async () => {
    const params = testData.tasks.new;
    const response = await app.inject({
      method: 'POST',
      url: app.reverse('tasksCreate'),
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
      url: app.reverse('tasksCreate'),
      payload: {
        data: params,
      },
      cookies: cookie,
    });

    expect(response.statusCode).toBe(302);

    const taskWithoutGraph = await models.task.query().findOne({ name: params.name });
    const { id } = taskWithoutGraph;
    const createdTaskWithGraph = await models.task.query().findById(id).withGraphJoined('[labels, creator, status]');

    const { idForCheck } = testData.labels.current;

    const label = await models.label.query().findById(idForCheck);
    const relatedTasks = await label.$relatedQuery('tasks');
    const [expectedCreatorId, expectedStatusId, expectedLabelsLength] = [2, 1, 3];

    const actualCreatorId = createdTaskWithGraph.creator.id;
    const actualStatusId = createdTaskWithGraph.status.id;
    const actualLabelsLength = createdTaskWithGraph.labels.length;

    expect(actualCreatorId).toEqual(expectedCreatorId);
    expect(actualStatusId).toEqual(expectedStatusId);
    expect(actualLabelsLength).toEqual(expectedLabelsLength);
    expect(relatedTasks).toContainEqual(taskWithoutGraph);
  });

  it('update task - status, description, name', async () => {
    const id = await getEntityIdByData(testData.tasks.current, models.task);

    const params = testData.tasks.toUpdate;
    const response = await app.inject({
      method: 'PATCH',
      url: app.reverse('tasksUpdate', { id }),
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
    const id = await getEntityIdByData(testData.tasks.taskToDelete, models.task);

    const response = await app.inject({
      method: 'DELETE',
      url: app.reverse('tasksDelete', { id }),
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
