import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[creator,status, executor]');
      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      reply.render('tasks/index', { tasks, users, statuses });
      return reply;
    })
    .get('/tasks/new', { name: 'newTask' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      const usersNormalized = users.map((user) => ({ ...user, name: user.firstName }));
      const statuses = await app.objection.models.status.query();
      const task = new app.objection.models.task();
      reply.render('tasks/new', { task, usersNormalized, statuses });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      const usersNormalized = users.map((user) => ({ ...user, name: user.firstName }));
      const statuses = await app.objection.models.status.query();
      const { id } = req.params;
      const taskToEdit = await app.objection.models.task.query().findById(id);
      await console.log(usersNormalized, 'XXXXXXXXXXXXXXXXX', taskToEdit);
      reply.render('tasks/edit', { usersNormalized, statuses, taskToEdit });
      return reply;
    })
    .get('/tasks/:id', { name: 'showTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      await console.log(id, 'SSSSSSSSSSSSS');
      const task = await app.objection.models.task
        .query()
        .findById(id)
        .withGraphJoined('[creator, executor, status]');
      await console.log(task, 'AAAAAAAAAAAA');
      reply.render('tasks/show', { task });
      return reply;
    })
    .post('/tasks', { name: 'createTask', preValidation: app.authenticate }, async (req, reply) => {
      const { statusId, executorId } = req.body.data;
      try {
        const validTask = await app.objection.models.task.fromJson(
          {
            ...req.body.data,
            creatorId: parseInt(req.user.id, 10),
            statusId: parseInt(statusId, 10),
            executorId: parseInt(executorId, 10),
          },
        );
        await app.objection.models.task.query().insert(validTask);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (e) {
        await console.log(e);
      }
    })
    .patch('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      await console.log(req.body.data);
      const { statusId, executorId } = req.body.data;
      try {
        const taskToEdit = await app.objection.models.task.query().findById(id);
        await taskToEdit.$query().patch(
          {
            ...req.body.data,
            statusId: parseInt(statusId, 10),
            executorId: parseInt(executorId, 10),
          },
        );
        req.flash('info', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      } catch (err) {
        await console.log('!!!!!!!!!!!!!!!!!!');
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
