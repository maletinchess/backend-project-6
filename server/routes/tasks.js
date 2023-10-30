import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[creator, status, executor, labels]');
      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      const labels = await app.objection.models.label.query();
      reply.render('tasks/index', {
        tasks, users, statuses, labels,
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
      const { statusId } = req.body.data;
      await console.log(req.body.data, 'CREATE TASK DATA');

      try {
        const validTask = await app.objection.models.task.fromJson(
          {
            ...req.body.data,
            creatorId: parseInt(req.user.id, 10),
            statusId: parseInt(statusId, 10),
          },
        );
        await app.objection.models.task.transaction(async (trx) => {
          await app.objection.models.task
            .query(trx)
            .insertGraph([{ ...validTask }], {
              relate: ['labels'],
            });
        });
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (e) {
        await console.log(e);
      }
    })
    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const { statusId } = req.body.data;
      try {
        const taskToEdit = await app.objection.models.task.query().findById(id);
        await taskToEdit.$query().patch(
          {
            ...req.body.data,
            statusId: parseInt(statusId, 10),
          },
        );
        req.flash('info', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (err) {
        await console.log(err);
      }
    })
    .delete('/tasks/:id', { name: 'deleteTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      try {
        const taskToDelete = await app.objection.models.task.query().findById(id);
        await taskToDelete.$query().delete();
        req.flash('info', i18next.t('flash.tasks.delete.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    });
};
