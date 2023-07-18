// @ts-check

import { sign } from 'crypto';
import i18next from 'i18next';

export default (app) => {
  app
    .get('/session/new', { name: 'newSession' }, (req, reply) => {
      const signInForm = {};
      reply.render('session/new', { signInForm });
    })
    .post('/session', { name: 'session' }, app.fp.authenticate('form', async (req, reply, err, user) => {
      await console.log(user, 'user');
      if (err) {
        await console.log(err, 'SESSION-ERR');
        return app.httpErrors.internalServerError(err);
      }
      if (!user) {
        await console.log('SESSION_ERR!!!!!', user);
        const signInForm = {...req.body.data, password: ''};
        await console.log(req.body.data, 'req-body-data');
        await console.log(signInForm, 'SIGN-IN-FORM');
        const errors = {
          email: [{ message: i18next.t('flash.session.create.error') }],
        };
        reply.render('session/new', { signInForm, errors });
        return reply;
      }
      await req.logIn(user);
      req.flash('success', i18next.t('flash.session.create.success'));
      return reply.redirect(app.reverse('root'));
    }))
    .delete('/session', (req, reply) => {
      req.logOut();
      req.flash('info', i18next.t('flash.session.delete.success'));
      reply.redirect(app.reverse('root'));
    });
};
