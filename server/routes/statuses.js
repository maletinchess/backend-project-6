import i18next from 'i18next';

export default (app) => {
  app
    .get('/statuses', { name: 'statuses' }, async (req, reply) => {
      const statuses = await app.objection.models.status.query();
      reply.render('statuses/index', { statuses });
      return reply;
    })
    .get('/statuses/new', { name: 'getNewStatusPage' }, (req, reply) => {
      const status = new app.objection.models.status();
      reply.render('statuses/new');
    })
    .get('/statuses/:id/edit', { name: 'editStatus' }, (req, reply) => {
      const { id } = req.params;
      const statusToEdit = app.objection.models.status.query().findById(id);
      reply.render('statuses/edit', { statusToEdit });
      return reply;
    })
    .post('/statuses', { name: 'createNewStatus' }, async (req, reply) => {
      await console.log(req.body);
      const status = new app.objection.models.status();
      status.$set(req.body.data);
      try {
        const validStatus = await app.objection.models.status.fromJson(req.body.data);
        await app.objection.models.status.query().insert(validStatus);
        req.flash('info', i18next.t('flash.statuses.create.success'));
        reply.redirect(app.reverse('statuses'));
      }
      catch(err) {
        await console.log(err);
      }
    })
    .patch('/statuses/:id', { name: 'updateStatus' }, async (req, reply) => {
      try {
        const { id } = req.params;
        const statusToEdit = await app.objection.models.status.query().findById(id);
        await statusToEdit.$query().patch(req.body.data);
        req.flash('success', i18next.t('flash.statuses.update.success'));
        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch (err) {
        console.log(err);
        throw(err);
      }
    })
    .delete('/statuses/:id', { name: 'deleteStatus' }, async (req, reply) => {
      try {
        const { id } = req.params;
        const statusToDelete = await app.objection.models.status.query().findById(id);
        await statusToDelete.$query().delete();
        req.flash('success', i18next.t('flash.statuses.delete.success'));
        reply.redirect(app.reverse('statuses'));
        return reply;
      } catch {
        throw(err);
      }
    })
};