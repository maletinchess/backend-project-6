import i18next from 'i18next';

import _ from 'lodash';

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      reply.render('labels/index', { labels });
      return reply;
    })
    .get('/labels/new', { name: 'labelsNew', preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
      reply.render('labels/new', { label });
      return reply;
    })
    .get('/labels/:id/edit', { name: 'labelsEdit', preValidation: app.authenticate }, async (req, reply) => {
      const labelToEdit = await app.objection.models.label.query().findById(req.params.id);
      reply.render('labels/edit', { labelToEdit });
      return reply;
    })
    .post('/labels', { name: 'labelsCreate', preValidation: app.authenticate }, async (req, reply) => {
      const label = await new app.objection.models.label();
      label.$set(req.body.data);
      try {
        const validLabel = await app.objection.models.label.fromJson(req.body.data);
        await app.objection.models.label.query().insert(validLabel);
        req.flash('info', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
      } catch (err) {
        const { data } = err;
        req.flash('error', i18next.t('flash.labels.create.error'));
        reply.render(app.reverse('labelsNew'), { label, errors: data });
      }
      return reply;
    })
    .patch('/labels/:id', { name: 'labelsUpdate', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const labelToUpdate = await app.objection.models.label.query().findById(id);
        await labelToUpdate.$query().patch(req.body.data);
        req.flash('success', i18next.t('flash.labels.update.success'));
        
      } catch (err) {
        req.flash('error', i18next.t('flash.labels.update.error'));
      }
      reply.redirect(app.reverse('labels'));
      return reply;
    })
    .delete('/labels/:id', { name: 'labelsDelete', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const labelToDelete = await app.objection.models.label.query().findById(id);
        const tasks = await labelToDelete.$relatedQuery('tasks');
        await console.log(tasks);
        if (_.isEmpty(tasks)) {
          await labelToDelete.$query().delete();
          req.flash('success', i18next.t('flash.labels.delete.success'));
        } else {
          req.flash('error', i18next.t('flash.labels.delete.error'));
        }
      } catch (err) {
        throw new Error(err);
      }
      reply.redirect(app.reverse('labels'));
      return reply;
    });
};
