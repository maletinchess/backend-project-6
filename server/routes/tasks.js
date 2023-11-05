import i18next from 'i18next';
import _ from 'lodash';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
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

      const [tasks, users, statuses, labels] = await Promise.all([
        tasksQuery,
        app.objection.models.user.query(),
        app.objection.models.status.query(),
        app.objection.models.label.query(),
      ]);

      const task = await new app.objection.models.task();

      const usersNormalized = users.map((user) => ({ ...user, name: user.firstName }));

      reply.render('tasks/index', {
        tasks, usersNormalized, statuses, labels, task, query,
      });

      return reply;
    })
    .get('/tasks/new', { name: 'newTask' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      const usersNormalized = users.map((user) => ({ ...user, name: user.firstName }));
      const statuses = await app.objection.models.status.query();
      const task = new app.objection.models.task();
      const labels = await app.objection.models.label.query();
      reply.render('tasks/new', {
        task, usersNormalized, statuses, labels,
      });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      const usersNormalized = users.map((user) => ({ ...user, name: user.firstName }));
      const statuses = await app.objection.models.status.query();
      const labels = await app.objection.models.label.query();
      const { id } = req.params;
      const taskToEdit = await app.objection.models.task.query().findById(id).withGraphJoined('[labels]');
      await console.log(taskToEdit, 'TASK_TO_EDIT');
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
      await console.log(req.body.data, 'CREATE TASK DATA');

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

      const executorIdNormalized = executorId && executorId !== '' ? parseInt(executorId, 10) : 0;

      const graph = {
        ...req.body.data,
        creatorId: parseInt(req.user.id, 10),
        statusId: parseInt(statusId, 10),
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
      } catch (e) {
        await console.log(e, 'ERROR');
      }
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

      const executorIdNormalized = executorId && executorId !== '' ? parseInt(executorId, 10) : 0;

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
      }
    })
    .delete('/tasks/:id', { name: 'deleteTask', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const { creatorId } = await app.objection.models.task.query().findById(id);
        if (req.user.id !== creatorId) {
          req.flash('error', i18next.t('flash.tasks.delete.authError'));
          reply.redirect('/tasks');
        } else {
          const taskToDelete = await app.objection.models.task.query().findById(id);
          await taskToDelete.$query().delete();
          req.flash('info', i18next.t('flash.tasks.delete.success'));
          reply.redirect(app.reverse('tasks'));
          return reply;
        }
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    });
};
