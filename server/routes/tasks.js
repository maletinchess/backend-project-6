import i18next from 'i18next';

import {
  getDataForTasksRoute, createTaskTransaction, updateTaskTransaction, checkIfUserIsTaskCreator,
} from './helpers.js';

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
      if (!checkIfUserIsTaskCreator(req, taskToEdit)) {
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
        if (!checkIfUserIsTaskCreator(req, taskToDelete)) {
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
