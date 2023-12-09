import i18next from 'i18next';

export default (app) => {
  app
    .get('/statuses', { name: 'statusesIndex', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      await console.log(statuses);
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get('/statuses/new', { name: 'statusesNew', preValidation: app.authenticate }, (req, reply) => {
      reply.render('statuses/new');
    })
    .get('/statuses/:id/edit', { name: 'statusesEdit', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const statusToEdit = await app.objection.models.status.query().findById(id);
      reply.render('statuses/edit', { statusToEdit });
      return reply;
    })
    .post('/statuses', { name: 'statusesCreate', preValidation: app.authenticate }, async (req, reply) => {
      const status = new app.objection.models.status();
      status.$set(req.body.data);
      try {
        const validStatus = await app.objection.models.status.fromJson(req.body.data);
        await app.objection.models.status.query().insert(validStatus);
        req.flash('info', i18next.t('flash.statuses.create.success'));
        reply.redirect(app.reverse('statusesIndex'));
      } catch (err) {
        const { data } = err;
        req.flash('error', i18next.t('flash.statuses.create.error'));
        reply.render(app.reverse('getNewStatusPage'), { status, errors: data });
      }
      return reply;
    })
    .post('/statuses/:id', { name: 'statusesUpdate', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const statusToEdit = await app.objection.models.status.query().findById(id);
        await statusToEdit.$query().patch(req.body.data);
        req.flash('success', i18next.t('flash.statuses.update.success'));
        reply.redirect(app.reverse('statusesIndex'));
      } catch (err) {
        await console.log(err);
        throw (err);
      }
      return reply;
    })
    .delete('/statuses/:id', { name: 'statusesDelete', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const statusToDelete = await app.objection.models.status.query().findById(id);
        if (await app.checkIfEntityConnectedWithTask(statusToDelete)) {
          req.flash('error', i18next.t('flash.statuses.delete.error'));
        } else {
          await statusToDelete.$query().delete();
          req.flash('success', i18next.t('flash.statuses.delete.success'));
        }
        reply.redirect(app.reverse('statusesIndex'));
        return reply;
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    });
};
