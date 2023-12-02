import i18next from 'i18next';

const getCommonData = async (app) => {
  const users = await app.objection.models.user.query();
  const usersNormalized = users.map((user) => ({ ...user, name: `${user.firstName} ${user.lastName}` }));
  const statuses = await app.objection.models.status.query();
  const labels = await app.objection.models.label.query();
  const commonData = { usersNormalized, statuses, labels };
  return commonData;
};

const getDataForRender = async (app) => {
  const commonData = await getCommonData(app);
  const task = new app.objection.models.task();
  return {
    ...commonData, task,
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
    .get('/tasks', { name: 'tasksIndex' }, async (req, reply) => {
      const data = await getDataForRenderTasks(app, req);
      reply.render('tasks/index', data);
      return reply;
    })
    .get('/tasks/new', { name: 'tasksNew' }, async (req, reply) => {
      const data = await getDataForRender(app);
      reply.render('tasks/new', data);
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'tasksEdit', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const taskToEdit = await app.objection.models.task.query().findById(id).withGraphJoined('[labels]');
      if (!app.checkIfUserIsTaskCreator(req.user.id, taskToEdit)) {
        req.flash('error', i18next.t('flash.tasks.update.error'));
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      }

      const commonData = await getCommonData(app);

      reply.render('tasks/edit', {
        ...commonData, taskToEdit,
      });

      return reply;
    })
    .get('/tasks/:id', { name: 'tasksShow', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const task = await app.objection.models.task
        .query()
        .findById(id)
        .withGraphJoined('[creator, executor, status, labels]');
      reply.render('tasks/show', { task });
      return reply;
    })
    .post('/tasks', { name: 'tasksCreate', preValidation: app.authenticate }, async (req, reply) => {
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
        reply.redirect(app.reverse('tasksIndex'));
      } catch (err) {
        const { data } = err;
        const dataForRender = await getDataForRender(app, req);
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render(app.reverse('tasksNew'), { ...dataForRender, errors: data });
      }
      return reply;
    })
    .patch('/tasks/:id', { name: 'tasksUpdate', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { statusId, executorId, labels } = req.body.data;

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
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    })
    .delete('/tasks/:id', { name: 'tasksDelete', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const task = await app.objection.models.task.query().findById(id);
        if (!app.checkIfUserIsTaskCreator(req.user.id, task)) {
          req.flash('error', i18next.t('flash.tasks.delete.authError'));
        } else {
          const taskToDelete = await app.objection.models.task.query().findById(id);
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
