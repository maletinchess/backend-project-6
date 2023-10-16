const path = require('path');

const objectionUnique = require('objection-unique');
const BaseModel = require('./BaseModel.cjs');

const unique = objectionUnique({ fields: ['email'] });

module.exports = class Status extends unique(BaseModel) {
  static get tableName() {
    return 'statuses';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
      },
    };
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: BaseModel.HasManyRelation,
        modelClass: path.join(__dirname, 'Task'),
        join: {
          from: 'statuses.id',
          to: 'tasks.statusId',
        },
      },
    };
  }
};
