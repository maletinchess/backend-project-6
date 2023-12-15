import i18next from 'i18next';

import {
  createTaskTransaction, updateTaskTransaction, checkIfUserIsTaskCreator,
  mapRouteNameToFunction,
} from './helpers.js';

export default (app) => {
  app
    .get('/tasks', { name: 'tasksIndex' }, async (req, reply) => {
      const data = await mapRouteNameToFunction('tasksIndex')(app, req);
      reply.render('tasks/index', data);
      return reply;
    })
    .get('/tasks/new', { name: 'tasksNew' }, async (req, reply) => {
      const data = await mapRouteNameToFunction('tasksNew')(app);
      reply.render('tasks/new', data);
      return reply;
    })
    .get('/tasks/:id/edit', { name: 'tasksEdit', preValidation: app.authenticate }, async (req, reply) => {
      const data = await mapRouteNameToFunction('tasksEdit')(app, req);
      const { taskToEdit } = data;
      if (!checkIfUserIsTaskCreator(req, taskToEdit)) {
        req.flash('error', i18next.t('flash.tasks.edit.error'));
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      }

      reply.render('tasks/edit', {
        ...data,
      });

      return reply;
    })
    .get('/tasks/:id', { name: 'tasksShow', preValidation: app.authenticate }, async (req, reply) => {
      const task = await mapRouteNameToFunction('tasksShow')(app, req);
      reply.render('tasks/show', { task });
      return reply;
    })
    .post('/tasks', { name: 'tasksCreate', preValidation: app.authenticate }, async (req, reply) => {
      const data = await mapRouteNameToFunction('tasksCreate')(req);
      await console.log(data);
      const { graph, labels } = data;

      try {
        const validTask = await app.objection.models.task.fromJson(graph);
        const validData = { validTask, labels };
        await createTaskTransaction(app, validData);
        req.flash('info', i18next.t('flash.tasks.create.success'));
        reply.redirect(app.reverse('tasksIndex'));
      } catch (err) {
        const dataForRender = await mapRouteNameToFunction('tasksNew')(app);
        req.flash('error', i18next.t('flash.tasks.create.error'));
        reply.render('tasks/new', { ...dataForRender, errors: err.data });
      }
      return reply;
    })
    .patch('/tasks/:id', { name: 'tasksUpdate', preValidation: app.authenticate }, async (req, reply) => {
      const graph = await mapRouteNameToFunction('tasksUpdate')(req);

      try {
        await updateTaskTransaction(app, graph);
        req.flash('info', i18next.t('flash.tasks.update.success'));
        reply.redirect(app.reverse('tasksIndex'));
        return reply;
      } catch (err) {
        const dataForRender = await mapRouteNameToFunction('tasksEdit')(app, req);
        req.flash('error', i18next.t('flash.tasks.update.error'));
        reply.render('tasks/edit', { ...dataForRender, errors: err.data });
        return reply;
      }
    })
    .delete('/tasks/:id', { name: 'tasksDelete', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const taskToDelete = await mapRouteNameToFunction('tasksDelete')(app, req);
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
