import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  getTestData, prepareData, getCookies, getEntityIdByData, buildResponse, makeApp,
} from './helpers/index.js';

describe('test tasks CRUD', () => {
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

  it('tasks', async () => {
    const response = await buildResponse(app, 'GET', 'tasksIndex', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('get new task page', async () => {
    const response = await buildResponse(app, 'GET', 'tasksNew', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('get edit-task page', async () => {
    const taskToEditId = await getEntityIdByData(testData.tasks.current, models.task);

    const response = await buildResponse(app, 'GET', 'tasksEdit', { cookies: cookie, paramsId: taskToEditId });

    expect(response.statusCode).toBe(200);
  });

  it('create task', async () => {
    const data = testData.tasks.new;

    const response = await buildResponse(app, 'POST', 'tasksCreate', { cookies: cookie, data });

    expect(response.statusCode).toBe(302);

    const createdTask = await models.task.query().findOne({ name: data.name });
    expect(createdTask).toMatchObject(data);
  });

  it('create task with labels', async () => {
    const data = testData.tasks.newTaskWithLabels;

    const response = await buildResponse(app, 'POST', 'tasksCreate', { cookies: cookie, data });

    expect(response.statusCode).toBe(302);

    const taskWithoutGraph = await models.task.query().findOne({ name: data.name });
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
    const taskToUpdateId = await getEntityIdByData(testData.tasks.current, models.task);

    const data = testData.tasks.toUpdate;
    const response = await buildResponse(app, 'PATCH', 'tasksUpdate', { cookies: cookie, data, paramsId: taskToUpdateId });

    expect(response.statusCode).toBe(302);

    const updatedTask = await models.task.query().findById(taskToUpdateId);
    expect(updatedTask).toMatchObject(data);
  });

  it('user can delete task if he is creator', async () => {
    const taskToDeleteId = await getEntityIdByData(testData.tasks.taskToDelete, models.task);

    const response = await buildResponse(app, 'DELETE', 'tasksDelete', { cookies: cookie, paramsId: taskToDeleteId });

    expect(response.statusCode).toBe(302);
    const deletedTask = await models.task.query().findById(taskToDeleteId);
    expect(deletedTask).toBeUndefined();
  });

  afterEach(async () => {
    await knex('tasks').truncate();
  });

  afterAll(async () => {
    await app.close();
  });
});
