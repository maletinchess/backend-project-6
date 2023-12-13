// @ts-check

import i18next from 'i18next';

import { isUserConnectedWithTask } from './helpers.js';

export default (app) => {
  app
    .get('/users', { name: 'usersIndex' }, async (req, reply) => {
      const users = await app.objection.models.user.query();
      reply.render('users/index', { users });
      return reply;
    })
    .get('/users/new', { name: 'usersNew' }, (req, reply) => {
      const user = new app.objection.models.user();
      reply.render('users/new', { user });
    })
    .get('/users/:id/edit', { name: 'usersEdit', preValidation: app.checkEditAndDeleteUserPermission }, async (req, reply) => {
      const { id } = req.params;
      const userToEdit = await app.objection.models.user.query().findById(id);
      reply.render('users/edit', { userToEdit });
      return reply;
    })
    .post('/users', { name: 'usersCreate' }, async (req, reply) => {
      const user = new app.objection.models.user();
      user.$set(req.body.data);

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
    .post('/users/:id', { name: 'usersUpdate', preValidation: app.authenticate }, async (req, reply) => {
      try {
        const { id } = req.params;
        const userToEdit = await app.objection.models.user.query().findById(id);
        await userToEdit.$query().patch(req.body.data);
        req.flash('success', i18next.t('flash.users.edit.success'));
        reply.redirect(app.reverse('usersIndex'));
        return reply;
      } catch (err) {
        console.log(err);
        throw err;
      }
    })
    .delete('/users/:id', {
      name: 'usersDelete',
      preValidation: app.checkEditAndDeleteUserPermission,
    }, async (req, reply) => {
      try {
        const { id } = req.params;
        const user = await app.objection.models.user.query().findById(id);
        if (await isUserConnectedWithTask(user)) {
          req.flash('error', i18next.t('flash.users.delete.error'));
        } else {
          await user.$query().delete();
          req.logout();
          req.flash('success', i18next.t('flash.users.delete.success'));
        }
        reply.redirect(app.reverse('usersIndex'));
        return reply;
      } catch (err) {
        console.log(err);
        throw err;
      }
    });
};
