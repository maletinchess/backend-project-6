const normalizeIds = (data) => {
  const {
    statusId, executorId,
  } = data;

  const normalizedExecutorId = executorId && executorId !== '' ? parseInt(executorId, 10) : null;
  const normalizedStatusId = statusId && statusId !== '' ? parseInt(statusId, 10) : 0;

  return {
    statusId: normalizedStatusId,
    executorId: normalizedExecutorId,
  };
};

const normalizeLabels = (labels) => {
  if (!labels) {
    return [];
  }
  if (typeof (labels) === 'string' || typeof (l) === 'number') {
    return [labels].map((id) => ({ id: parseInt(id, 10) }));
  }

  return labels.map((id) => ({ id: parseInt(id, 10) }));
};

const getCommonData = async (app) => {
  const users = await app.objection.models.user.query();
  const usersNormalized = users.map((user) => ({ ...user, name: user.name }));
  const statuses = await app.objection.models.status.query();
  const labels = await app.objection.models.label.query();

  return { usersNormalized, statuses, labels };
};

const getDataForTasksIndex = async (app, req) => {
  const commonData = await getCommonData(app);
  const task = new app.objection.models.task();

  const { query } = req;
  const tasksQuery = app.objection.models.task.query().withGraphJoined('[creator, status, executor, labels]');

  if (query.executor) {
    tasksQuery.modify('filterExecutor', query.executor);
  }

  if (query.status) {
    tasksQuery.modify('filterStatus', query.status);
  }

  if (query.label) {
    tasksQuery.modify('filterLabel', query.label);
  }

  if (query.isCreatorUser) {
    tasksQuery.modify('filterCreator', req.user.id);
  }

  const [tasks] = await Promise.all([
    tasksQuery,
  ]);

  return {
    ...commonData, task, tasks, query,
  };
};

const getDataForTasksNew = async (app) => {
  const commonData = await getCommonData(app);
  const task = new app.objection.models.task();
  return { ...commonData, task };
};

const getDataForTasksShow = async (app, req) => {
  const { id } = req.params;
  const taskToShow = await app.objection.models.task
    .query()
    .findById(id)
    .withGraphJoined('[creator, executor, status, labels]');
  return taskToShow;
};

const getDataForTasksEdit = async (app, req) => {
  const commonData = await getCommonData(app);
  const { id } = req.params;
  const taskToEdit = await app.objection.models.task.query().findById(id).withGraphJoined('[labels]');
  return {
    ...commonData, taskToEdit,
  };
};

const getDataForTasksCreate = async (req) => {
  const ids = normalizeIds(req.body.data);
  const graph = { ...req.body.data, creatorId: req.user.id, ...ids };

  return { graph, labels: normalizeLabels(req.body.data.labels) };
};

const getDataForTasksUpdate = (req) => {
  const { id } = req.params;
  const ids = normalizeIds(req.body.data);
  const graph = {
    ...req.body.data,
    ...ids,
    labels: normalizeLabels(req.body.data.labels),
    id: parseInt(id, 10),
  };
  return graph;
};

const getDataForTasksDelete = async (app, req) => {
  const { id } = req.params;
  const taskToDelete = await app.objection.models.task.query().findById(id);
  return taskToDelete;
};

export const mapRouteNameToData = (routeName, app, req) => {
  switch (routeName) {
    case 'tasks':
      return getDataForTasksIndex(app, req);
    case 'tasksEdit':
      return getDataForTasksEdit(app, req);
    case 'tasksNew':
      return getDataForTasksNew(app);
    case 'tasksShow':
      return getDataForTasksShow(app, req);
    case 'tasksCreate':
      return getDataForTasksCreate(req);
    case 'tasksUpdate':
      return getDataForTasksUpdate(req);
    case 'tasksDelete':
      return getDataForTasksDelete(app, req);
    default:
      throw new Error(`Unknown ${routeName}`);
  }
};

export const createTaskTransaction = async (app, validData) => {
  const { validTask, labels } = validData;
  await app.objection.models.task.transaction(async (trx) => {
    await app.objection.models.task
      .query(trx)
      .insertGraph([{ ...validTask, labels }], {
        relate: ['labels'],
      });
  });
};

export const updateTaskTransaction = async (app, validData) => {
  await app.objection.models.task.transaction(async (trx) => {
    await app.objection.models.task.query(trx).upsertGraph(
      { ...validData },
      {
        relate: true,
        unrelate: true,
      },
    );
  });
};

export const isUserConnectedWithTask = async (user) => {
  const usersTasks = await user.$relatedQuery('tasks');
  const usersExecutedTask = await user.$relatedQuery('tasksExecutors');
  const connectedTasks = [...usersTasks, ...usersExecutedTask];
  return connectedTasks.length > 0;
};

export const checkIfUserIsTaskCreator = (req, task) => req.user.id === task.creatorId;

export const checkIfEntityConnectedWithTask = async (entity) => {
  const connectedTasks = await entity.$relatedQuery('tasks');
  return connectedTasks.length > 0;
};
