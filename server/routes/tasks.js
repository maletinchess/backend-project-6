import i18next from 'i18next';

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

const getDataForTasksRoute = async (app, req, routeName) => {
  const users = await app.objection.models.user.query();
  const usersNormalized = users.map((user) => ({ ...user, name: `${user.firstName} ${user.lastName}` }));
  const statuses = await app.objection.models.status.query();
  const labels = await app.objection.models.label.query();
  const task = new app.objection.models.task();

  const { id } = req.params;

  switch (routeName) {
    case 'tasksIndex': {
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
        task, tasks, usersNormalized, labels, statuses, query,
      };
    }
    case 'tasksNew':
      return {
        task, usersNormalized, statuses, labels,
      };
    case 'tasksEdit': {
      const taskToEdit = await app.objection.models.task.query().findById(id).withGraphJoined('[labels]');
      return {
        usersNormalized, statuses, labels, taskToEdit,
      };
    }

    case 'tasksShow': {
      const taskToShow = await app.objection.models.task
        .query()
        .findById(id)
        .withGraphJoined('[creator, executor, status, labels]');
      return taskToShow;
    }

    case 'tasksCreate': {
      const ids = normalizeIds(req.body.data);
      const graph = { ...req.body.data, creatorId: req.user.id, ...ids };
      console.log(req.body.data);

      return { graph, labels: normalizeLabels(req.body.data.labels) };
    }

    case 'tasksUpdate': {
      const ids = normalizeIds(req.body.data);
      console.log(req.body.data);
      const graph = {
        ...req.body.data,
        ...ids,
        labels: normalizeLabels(req.body.data.labels),
        id: parseInt(id, 10),
      };
      console.log(graph);
      return graph;
    }

    case 'tasksDelete': {
      const taskToDelete = await app.objection.models.task.query().findById(id);
      return taskToDelete;
    }

    default:
      throw new Error(`Unknown ${routeName}`);
  }
};

const createTaskTransaction = async (app, validData) => {
  const { validTask, labels } = validData;
  await app.objection.models.task.transaction(async (trx) => {
    await app.objection.models.task
      .query(trx)
      .insertGraph([{ ...validTask, labels }], {
        relate: ['labels'],
      });
  });
};

const updateTaskTransaction = async (app, validData) => {
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

export default (app) => {
  app
    .get('/tasks', { name: 'tasksIndex' }, async (req, reply) => {
      const data = await getDataForTasksRoute(app, req, 'tasksIndex');
      reply.render('tasks/index', data);
      return reply;
    })
    .get('/tasks/new', { name: 'tasksNew' }, async (req, reply) => {
      const data = await getDataForTasksRoute(app, req, 'tasksNew');
      reply.render('tasks/new', data);
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'tasksEdit', preValidation: app.authenticate }, async (req, reply) => {
      const data = await getDataForTasksRoute(app, req, 'tasksEdit');
      const { taskToEdit } = data;
      if (!app.checkIfUserIsTaskCreator(req.user.id, taskToEdit)) {
        req.flash('error', i18next.t('flash.tasks.update.error'));
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      }

      reply.render('tasks/edit', {
        ...data,
      });

      return reply;
    })
    .get('/tasks/:id', { name: 'tasksShow', preValidation: app.authenticate }, async (req, reply) => {
      const task = await getDataForTasksRoute(app, req, 'tasksShow');
      reply.render('tasks/show', { task });
      return reply;
    })
    .post('/tasks', { name: 'tasksCreate', preValidation: app.authenticate }, async (req, reply) => {
      const data = await getDataForTasksRoute(app, req, 'tasksCreate');
      const { graph, labels } = data;

      try {
        const validTask = await app.objection.models.task.fromJson(graph);
        const validData = { validTask, labels };
        await createTaskTransaction(app, validData);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasksIndex'));
      } catch (err) {
        const dataForRender = await getDataForTasksRoute(app, req, 'tasksNew');
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render(app.reverse('tasksNew'), { ...dataForRender, errors: err.data });
      }
      return reply;
    })
    .patch('/tasks/:id', { name: 'tasksUpdate', preValidation: app.authenticate }, async (req, reply) => {
      const graph = await getDataForTasksRoute(app, req, 'tasksUpdate');

      try {
        await updateTaskTransaction(app, graph);
        req.flash('info', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    })
    .delete('/tasks/:id', { name: 'tasksDelete', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const taskToDelete = await getDataForTasksRoute(app, req, 'tasksDelete');
        if (!app.checkIfUserIsTaskCreator(req.user.id, taskToDelete)) {
          req.flash('error', i18next.t('flash.tasks.delete.authError'));
        } else {
          await taskToDelete.$query().delete();
          req.flash('info', i18next.t('flash.tasks.delete.success'));
        }
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    });
};
