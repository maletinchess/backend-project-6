import i18next from 'i18next';

export default (app) => {
  app
    .get('/labels', { name: 'labels', preValidation: app.authenticate }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      await console.log(labels);
      reply.render('labels/index', { labels });
      return reply;
    })
    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
      reply.render('labels/new', { label });
      return reply;
    })
    .get('/labels/:id/edit', { name: 'editLabel', preValidation: app.authenticate }, async (req, reply) => {
      const labelToEdit = await app.objection.models.label.query().findById(req.params.id);
      reply.render('labels/edit', { labelToEdit });
      return reply;
    })
    .post('/labels', { name: 'createLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = await new app.objection.models.label();
      label.$set(req.body.data);
      try {
        const validLabel = await app.objection.models.label.fromJson(req.body.data);
        await console.log(validLabel);
        await app.objection.models.label.query().insert(validLabel);
        req.flash('info', i18next.t('flash.labels.create.success'));
        reply.redirect(app.reverse('labels'));
        return reply;
      } catch (err) {
        await console.log(err, 'CREATE LABEL ERROR');
      }
    })
    .post('/labels/:id', { name: 'updateLabel', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const labelToUpdate = await app.objection.models.label.query().findById(id);
        await labelToUpdate.$query().patch(req.body.data);
        req.flash('success', i18next.t('flash.labels.update.success'));
        reply.redirect(app.reverse('labels'));
      } catch (err) {
        await console.log(err);
      }
    })
    .delete('/labels/:id', { name: 'deleteLabel', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const labelToDelete = await app.objection.models.label.query().findById(id);
        await console.log(labelToDelete);
        const tasks = await labelToDelete.$relatedQuery('tasks');
        await console.log(tasks);
        if (tasks.length !== 0) {
          req.flash('error', i18next.t('flash.labels.delete.error'));
        } else {
          await labelToDelete.$query().delete();
          req.flash('success', i18next.t('flash.labels.delete.success'));
        }
        reply.redirect(app.reverse('labels'));
        return reply;
      } catch (err) {
        await console.log(err);
      }
    });
};
