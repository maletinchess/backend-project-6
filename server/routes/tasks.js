import i18next from 'i18next';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const tasks = await app.objection.models.task.query().withGraphJoined('[creator, status, executor]');
      await console.log(tasks);
      const statuses = await app.objection.models.status.query();
      const users = await app.objection.models.user.query();
      reply.render('task/index', { tasks, users, statuses });
    })
    .get('/tasks/new', { name: 'newTask' }, async (req, reply) => {
      const users = await app.objection.models.task.query();
      const statuses = await app.objection.models.task.query();
      reply.render('tasks/new', { users, statuses });
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'editTask', preValidation: app.authenticate }, async (req, reply) => {
      const users = await app.objection.models.task.query();
      const statuses = await app.objection.models.task.query();
      reply.render('tasks/edit', { users, statuses });
    })
    .post('/tasks', { name: 'createTask', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const validTask = await app.objection.models.task.fromJson(
          { ...req.body.data, creatorId: req.user.id },
        );
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
