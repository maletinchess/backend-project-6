// @ts-check

import { URL } from 'url';
import fs from 'fs';
import path from 'path';

// TODO: использовать для фикстур https://github.com/viglucci/simple-knex-fixtures

const getFixturePath = (filename) => path.join('..', '..', '__fixtures__', filename);
const readFixture = (filename) => fs.readFileSync(new URL(getFixturePath(filename), import.meta.url), 'utf-8').trim();
const getFixtureData = (filename) => JSON.parse(readFixture(filename));

export const getTestData = () => getFixtureData('testData.json');

export const prepareData = async (app) => {
  const { knex } = app.objection;

  // получаем данные из фикстур и заполняем БД
  await knex('users').insert(getFixtureData('users.json'));
  await knex('statuses').insert(getFixtureData('statuses.json'));
  await knex('tasks').insert(getFixtureData('tasks.json'));
  await knex('labels').insert(getFixtureData('labels.json'));
  await knex('labels_tasks').insert(getFixtureData('labels_tasks.json'));
};

export const getCookies = async (app, userData) => {
  try {
    const responseSignIn = await app.inject({
      method: 'POST',
      url: app.reverse('session'),
      payload: {
        data: userData,
      },
    });

    const [sessionCookie] = responseSignIn.cookies;
    const { name, value } = sessionCookie;
    const cookie = { [name]: value };

    return cookie;
  } catch (err) {
    await console.log(err);
    throw (err);
  }
};

export const getUserIdByData = async (data, user) => {
  const { id } = await user.query().findOne({ email: data.email });
  return id;
};

export const getEntityIdByData = async (data, entity) => {
  const { id } = await entity.query().findOne({ name: data.name });
  return id;
};

export const buildResponse = async (app, method, routeName, options = {}) => {
  await console.log(options);
  const url = options.paramsId
    ? app.reverse(routeName, { id: options.paramsId })
    : app.reverse(routeName);
  const response = await app.inject({
    method,
    url,
    payload: {
      data: options.data ?? {},
    },
    cookies: options.cookies ?? {},
    query: options.query ?? {},
  });

  return response;
};

export const makeApp = (fastify) => fastify({
  exposeHeadRoutes: false,
  logger: { target: 'pino-pretty' },
});
