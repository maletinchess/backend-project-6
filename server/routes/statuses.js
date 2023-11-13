import i18next from 'i18next';

export default (app) => {
  app
    .get('/statuses', { name: 'statuses', preValidation: app.authenticate }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      await console.log(statuses);
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get('/statuses/new', { name: 'getNewStatusPage', preValidation: app.authenticate }, (req, reply) => {
      reply.render('statuses/new');
    })
    .get('/statuses/:id/edit', { name: 'editStatus', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      await console.log(id);
      const statusToEdit = await app.objection.models.status.query().findById(id);
      await console.log(statusToEdit, 'STATUS');
      reply.render('statuses/edit', { statusToEdit });
      return reply;
    })
    .post('/statuses', { name: 'createNewStatus', preValidation: app.authenticate }, async (req, reply) => {
      const status = new app.objection.models.status();
      status.$set(req.body.data);
      try {
        const validStatus = await app.objection.models.status.fromJson(req.body.data);
        await app.objection.models.status.query().insert(validStatus);
        req.flash('info', i18next.t('flash.statuses.create.success'));
        reply.redirect(app.reverse('statuses'));
      } catch (err) {
        await console.log(err, err.data.name[0]);
      }
    })
    .post('/statuses/:id', { name: 'updateStatus', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const statusToEdit = await app.objection.models.status.query().findById(id);
        await statusToEdit.$query().patch(req.body.data);
        req.flash('success', i18next.t('flash.statuses.update.success'));
        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch (err) {
        console.log(err);
        throw (err);
      }
    })
    .delete('/statuses/:id', { name: 'deleteStatus', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const statusToDelete = await app.objection.models.status.query().findById(id);
        if (await app.checkIfEntityConnectedWithTask(statusToDelete)) {
          req.flash('error', i18next.t('flash.statuses.delete.error'));
        } else {
          await statusToDelete.$query().delete();
          req.flash('success', i18next.t('flash.statuses.delete.success'));
        }
        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch (err) {
        await console.log(err);
        throw (err);
      }
    });
};
