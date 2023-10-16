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
      await console.log(usersNormalized);
      const statuses = await app.objection.models.status.query();
      const task = new app.objection.models.task();
      reply.render('tasks/new', { task, usersNormalized, statuses });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const users = await app.objection.models.status.query();
      const usersNormalized = users.map((user) => ({ ...user, name: user.firstName }));
      const statuses = await app.objection.models.status.query();
      const { id } = req.params;
      await console.log(id);
      const taskToEdit = await app.objection.models.task.query().findById(id);
      await console.log(taskToEdit, 'XXXXXXXXXXXXXXXXX');
      reply.render('tasks/edit', { usersNormalized, statuses, taskToEdit });
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
        await console.log(validTask);
        await app.objection.models.task.query().insert(validTask);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (e) {
        await console.log(e);
      }
    })
    .post('/tasks/:id', { name: 'updateTask', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const taskToEdit = await app.objection.models.task.query().findById(id);
        await taskToEdit.$query().patch(req.body.data);
        req.flash('info', i18next.t('flash.tasks.create.success'));
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
