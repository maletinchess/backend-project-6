// @ts-check

import { URL } from 'url';
import fs from 'fs';
import path from 'path';

const getFixturePath = (filename) => path.join('..', '..', '__fixtures__', filename);
const readFixture = (filename) => fs.readFileSync(new URL(getFixturePath(filename), import.meta.url), 'utf-8').trim();
const getFixtureData = (filename) => JSON.parse(readFixture(filename));

export const getTestData = () => getFixtureData('testData.json');

export const prepareData = async (app) => {
  const { knex } = app.objection;
  await knex('users').insert(getFixtureData('users.json'));
  await knex('statuses').insert(getFixtureData('statuses.json'));
  await knex('tasks').insert(getFixtureData('tasks.json'));
  await knex('labels').insert(getFixtureData('labels.json'));
  await knex('labels_tasks').insert(getFixtureData('labels_tasks.json'));
};

export const signIn = async (app, routeName, userData) => {
  const responseSignIn = await app.inject({
    method: 'POST',
    url: routeName,
    payload: {
      data: userData,
    },
  });

  const [sessionCookie] = responseSignIn.cookies;
  const { name, value } = sessionCookie;
  const cookie = { [name]: value };

  return cookie;
};

export const getUserIdByData = async (data, user) => {
  const { id } = await user.query().findOne({ email: data.email });
  return id;
};

export const getEntityIdByData = async (data, entity) => {
  const entityQuery = await entity.query();
  await console.log(entityQuery, data);
  const { id } = await entity.query().findOne({ name: data.name });
  return id;
};

export const buildResponse = async (app, method, routeName, options = {}) => {
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
