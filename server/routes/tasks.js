import i18next from 'i18next';

import {
  createTaskTransaction, updateTaskTransaction, checkIfUserIsTaskCreator,
  mapRouteNameToData,
} from './helpers.js';

export default (app) => {
  app
    .get('/tasks', { name: 'tasks' }, async (req, reply) => {
      const data = await mapRouteNameToData('tasks', app, req);
      reply.render('tasks/index', data);
      return reply;
    })
    .get('/tasks/new', { name: 'tasksNew' }, async (req, reply) => {
      const data = await mapRouteNameToData('tasksNew', app, req);
      reply.render('tasks/new', data);
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'tasksEdit', preValidation: app.authenticate }, async (req, reply) => {
      const data = await mapRouteNameToData('tasksEdit', app, req);
      const { taskToEdit } = data;
      if (!checkIfUserIsTaskCreator(req, taskToEdit)) {
        req.flash('error', i18next.t('flash.tasks.edit.error'));
        reply.redirect(app.reverse('tasks'));
        return reply;
      }

      reply.render('tasks/edit', {
        ...data,
      });

      return reply;
    })
    .get('/tasks/:id', { name: 'tasksShow', preValidation: app.authenticate }, async (req, reply) => {
      const task = await mapRouteNameToData('tasksShow', app, req);
      reply.render('tasks/show', { task });
      return reply;
    })
    .post('/tasks', { name: 'tasksCreate', preValidation: app.authenticate }, async (req, reply) => {
      const data = await mapRouteNameToData('tasksCreate', app, req);
      const { graph, labels } = data;

      try {
        const validTask = await app.objection.models.task.fromJson(graph);
        const validData = { validTask, labels };
        await createTaskTransaction(app, validData);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (err) {
        const dataForRender = await mapRouteNameToData('tasksNew', app, req);
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', { ...dataForRender, errors: err.data });
      }
      return reply;
    })
    .patch('/tasks/:id', { name: 'tasksUpdate', preValidation: app.authenticate }, async (req, reply) => {
      const graph = await mapRouteNameToData('tasksUpdate', app, req);

      try {
        await updateTaskTransaction(app, graph);
        req.flash('info', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasks'));
      } catch (err) {
        const dataForRender = await mapRouteNameToData('tasksEdit')(app, req);
        req.flash('error', i18next.t('flash.tasks.update.error'));
        reply.render('tasks/edit', { ...dataForRender, errors: err.data });
      }
      return reply;
    })
    .delete('/tasks/:id', { name: 'tasksDelete', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const taskToDelete = await mapRouteNameToData('tasksDelete', app, req);
        if (!checkIfUserIsTaskCreator(req, taskToDelete)) {
          req.flash('error', i18next.t('flash.tasks.delete.authError'));
        } else {
          await taskToDelete.$query().delete();
          req.flash('info', i18next.t('flash.tasks.delete.success'));
        }
      } catch (err) {
        req.flash('error', i18next.t('flash.tasks.delete.unknownError'));
      }
      reply.redirect(app.reverse('tasks'));
      return reply;
    });
};
