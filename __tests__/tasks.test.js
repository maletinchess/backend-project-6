import fastify from 'fastify';

import init from '../server/plugin.js';
import {
  getTestData, prepareData, signIn, getEntityIdByData, buildResponse, makeApp,
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
    await knex.migrate.latest();
    await prepareData(app);
    models = app.objection.models;
  });

  beforeEach(async () => {
    cookie = await signIn(app, app.reverse('session'), testData.users.existing);
  });

  it('should return 200 on GET tasks', async () => {
    const response = await buildResponse(app, 'GET', 'tasks', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('should return 200 on GET tasksNew', async () => {
    const response = await buildResponse(app, 'GET', 'tasksNew', { cookies: cookie });

    expect(response.statusCode).toBe(200);
  });

  it('should return 200 on GET tasksEdit', async () => {
    const taskToEditId = await getEntityIdByData(testData.tasks.current, models.task);

    const response = await buildResponse(app, 'GET', 'tasksEdit', { cookies: cookie, paramsId: taskToEditId });

    expect(response.statusCode).toBe(200);
  });

  it('should create task on POST tasksCreate', async () => {
    const data = testData.tasks.new;

    const response = await buildResponse(app, 'POST', 'tasksCreate', { cookies: cookie, data });

    expect(response.statusCode).toBe(302);

    const createdTask = await models.task.query().findOne({ name: data.name });
    expect(createdTask).toMatchObject(data);
  });

  it('should create task with labels', async () => {
    const data = testData.tasks.newTaskWithLabels;

    const response = await buildResponse(app, 'POST', 'tasksCreate', { cookies: cookie, data });

    expect(response.statusCode).toBe(302);

    const taskWithoutGraph = await models.task.query().findOne({ name: data.name });
    const { id } = taskWithoutGraph;
    const createdTaskWithGraph = await models.task.query().findById(id).withGraphJoined('[labels, creator, status]');

    const labelIds = data.labels;

    const taskLabels = await Promise.all(
      labelIds
        .sort((a, b) => (a < b))
        .map(async (labelId) => models.label.query().findById(labelId)),
    );

    const expectedTaskData = {
      creator: {
        id: 2,
      },
      status: {
        id: 1,
      },
      labels: taskLabels,
    };

    expect(createdTaskWithGraph).toMatchObject(expectedTaskData);

    const { idForCheck } = testData.labels.current;
    const label = await models.label.query().findById(idForCheck);
    const relatedTasks = await label.$relatedQuery('tasks');

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

  afterAll(async () => {
    await knex('tasks').truncate();
    await app.close();
  });
});
