const path = require('path');

const objectionUnique = require('objection-unique');
const BaseModel = require('./BaseModel.cjs');

const unique = objectionUnique({ fields: ['email'] });

module.exports = class Task extends unique(BaseModel) {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'creatorId'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
        description: { type: 'string' },
        creatorId: { type: 'integer' },
        statusId: { type: 'integer' },
        executorId: { type: 'integer' },
      },
    };
  }

  static get relationMappings() {
    return {
      creator: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.cjs'),
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'User.cjs'),
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
      },
      status: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: path.join(__dirname, 'Status.cjs'),
        join: {
          from: 'tasks.statusId',
          to: 'statuses.id',
        },
      },
    };
  }
};
