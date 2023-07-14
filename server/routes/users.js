// @ts-check

import i18next from 'i18next';

export default (app) => {
  app
    .get('/users', { name: 'users' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'newUser' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .get('/users/:id/edit', { name: 'editUser' }, async (req, reply) => {
      const { id } = req.params;
      const userToEdit = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { userToEdit });
      return reply;
    })
    .post('/users', async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);
      const users = await app.objection.models.user.query();
      console.log(req.body.data);

      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        await console.log(validUser);
        await app.objection.models.user.query().insert(validUser);
        await console.log(users);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch (err) {
        const { data } = err;
        await console.log(err);
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user, errors: data });
      }

      return reply;
    })
    .post('/users/:id', { name: 'updateUser' }, async (req, reply) => {
      try {
        await console.log(req.params);
        const { id } = req.params;
        const userToEdit = await app.objection.models.user.query().findById(id);
        await console.log(userToEdit, 'PATCH LOG');
        await userToEdit.$query().patch(req.body.data);
        req.flash('success', i18next.t('flash.users.edit.success'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      catch(err) {
        throw err;
      };
    })
    .delete('/users/:id', { name: 'deleteUser'}, async (req, reply) => {
      try {
        const { id } = req.params;
        const user = await app.objection.models.user.query().findById(id);
        await user.$query().delete();
        req.flash('success', i18next.t('flash.users.delete.success'));
        reply.redirect(app.reverse('users'));
        return reply;
      }
      catch(err) {
        console.log(err);
      }
    });
};
