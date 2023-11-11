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
    .get('/users/:id/edit', { name: 'editUser', preValidation: app.checkEditAndDeletePermission }, async (req, reply) => {
      const { id } = req.params;
      const userToEdit = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { userToEdit });
      return reply;
    })
    .post('/users', async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);
      await console.log(user);

      try {
        const validUser = await app.objection.models.user.fromJson(req.body.data);
        await app.objection.models.user.query().insert(validUser);
        req.flash('info', i18next.t('flash.users.create.success'));
        reply.redirect(app.reverse('root'));
      } catch (err) {
        const { data } = err;
        req.flash('error', i18next.t('flash.users.create.error'));
        reply.render('users/new', { user, errors: data });
      }

      return reply;
    })
    .post('/users/:id', { name: 'updateUser', preValidation: app.checkEditAndDeletePermission }, async (req, reply) => {
      try {
        const { id } = req.params;
        const userToEdit = await app.objection.models.user.query().findById(id);
        await userToEdit.$query().patch(req.body.data);
        req.flash('success', i18next.t('flash.users.edit.success'));
        reply.redirect(app.reverse('users'));
        return reply;
      } catch (err) {
        console.log(err);
        throw err;
      }
    })
    .delete('/users/:id', {
      name: 'deleteUser',
      preValidation: app.checkEditAndDeletePermission,
    }, async (req, reply) => {
      try {
        const { id } = req.params;
        const user = await app.objection.models.user.query().findById(id);
        const userTasks = await user.$relatedQuery('tasks');
        await console.log(user, userTasks, 'TASKS AND USER LOG');
        if (userTasks.length !== 0) {
          req.flash('error', i18next.t('flash.users.delete.error'));
        } else {
          await user.$query().delete();
          req.logout();
          req.flash('success', i18next.t('flash.users.delete.success'));
        }
        reply.redirect(app.reverse('users'));
        return reply;
      } catch (err) {
        console.log(err);
        throw err;
      }
    });
};
