import i18next from 'i18next';

const getDataForRender = async (app) => {
  const users = await app.objection.models.user.query();
  const usersNormalized = users.map((user) => ({ ...user, name: `${user.firstName} ${user.lastName}` }));
  const statuses = await app.objection.models.status.query();
  const task = new app.objection.models.task();
  const labels = await app.objection.models.label.query();

  return {
    usersNormalized, statuses, labels, task,
  };
};

const makeTaskQuery = (app, req) => {
  const { query, user: { id } } = req;
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
    tasksQuery.modify('filterCreator', id);
  }

  return tasksQuery;
};

const getDataForRenderTasks = async (app, req) => {
  const task = await new app.objection.models.task();
  const { query } = req;
  const tasksQuery = makeTaskQuery(app, req);

  const [tasks, users, statuses, labels] = await Promise.all([
    tasksQuery,
    app.objection.models.user.query(),
    app.objection.models.status.query(),
    app.objection.models.label.query(),
  ]);

  const usersNormalized = users.map((user) => ({ ...user, name: `${user.firstName} ${user.lastName}` }));

  const data = {
    task, tasks, usersNormalized, statuses, labels, query,
  };

  return data;
};

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const data = await getDataForRenderTasks(app, req);
      reply.render('tasks/index', data);
      return reply;
    })
    .get('/tasks/new', { name: 'newTask' }, async (req, reply) => {
      const data = await getDataForRender(app);
      reply.render('tasks/new', data);
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const taskToEdit = await app.objection.models.task.query().findById(id).withGraphJoined('[labels]');
      if (!app.checkIfUserIsTaskCreator(req.user.id, taskToEdit)) {
        req.flash('error', i18next.t('flash.tasks.update.error'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }
      const users = await app.objection.models.user.query();
      const usersNormalized = users.map((user) => ({ ...user, name: `${user.firstName} ${user.lastName}` }));

      const statuses = await app.objection.models.status.query();
      const labels = await app.objection.models.label.query();

      reply.render('tasks/edit', {
        usersNormalized, statuses, labels, taskToEdit,
      });

      return reply;
    })
    .get('/tasks/:id', { name: 'showTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task
        .query()
        .findById(id)
        .withGraphJoined('[creator, executor, status, labels]');
      reply.render('tasks/show', { task });
      return reply;
    })
    .post('/tasks', { name: 'createTask', preValidation: app.authenticate }, async (req, reply) => {
      const { statusId, labels, executorId } = req.body.data;

      const normalizeLabels = (l) => {
        if (!l) {
          return [];
        }
        if (typeof (l) === 'string' || typeof (l) === 'number') {
          return [l].map((id) => ({ id: parseInt(id, 10) }));
        }

        return l.map((id) => ({ id: parseInt(id, 10) }));
      };

      const labelsNormalized = normalizeLabels(labels);

      const executorIdNormalized = executorId && executorId !== '' ? parseInt(executorId, 10) : null;
      await console.log(executorId, Number.isInteger(executorIdNormalized), 'executorID LOG');

      const statusIdNormalized = statusId && statusId !== '' ? parseInt(statusId, 10) : 0;

      const graph = {
        ...req.body.data,
        creatorId: parseInt(req.user.id, 10),
        statusId: statusIdNormalized,
        executorId: executorIdNormalized,
      };

      try {
        const validTask = await app.objection.models.task.fromJson(graph);
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task
            .query(trx)
            .insertGraph([{ ...validTask, labels: labelsNormalized }], {
              relate: ['labels'],
            });
        });
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (err) {
        const { data } = err;
        const dataForRender = await getDataForRender(app, req);
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render(app.reverse('newTask'), { ...dataForRender, errors: data });
      }
      return reply;
    })
    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { statusId, executorId, labels } = req.body.data;
      await console.log(req.body.data, 'REQ BODY DATA: UPDATE TASK');

      const normalizeLabels = (l) => {
        if (!l) {
          return [];
        }
        if (typeof (l) === 'string' || typeof (l) === 'number') {
          return [l].map((i) => ({ id: parseInt(i, 10) }));
        }

        return l.map((i) => ({ id: parseInt(i, 10) }));
      };

      const labelsNormalized = normalizeLabels(labels);

      const executorIdNormalized = executorId && executorId !== '' ? parseInt(executorId, 10) : null;

      const graph = {
        ...req.body.data,
        statusId: parseInt(statusId, 10),
        executorId: executorIdNormalized,
        labels: labelsNormalized,
        id: parseInt(id, 10),
      };

      try {
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task.query(trx).upsertGraph(
            { ...graph },
            {
              relate: true,
              unrelate: true,
            },
          );
        });
        req.flash('info', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    })
    .delete('/tasks/:id', { name: 'deleteTask', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const task = await app.objection.models.task.query().findById(id);
        await console.log(task, 'TASK TO DElETE - LOG');
        if (!app.checkIfUserIsTaskCreator(req.user.id, task)) {
          req.flash('error', i18next.t('flash.tasks.delete.authError'));
        } else {
          const taskToDelete = await app.objection.models.task.query().findById(id);
          await taskToDelete.$query().delete();
          req.flash('info', i18next.t('flash.tasks.delete.success'));
        }
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    });
};
