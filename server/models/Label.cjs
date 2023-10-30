const path = require('path');

const BaseModel = require('./BaseModel.cjs');

module.exports = class Label extends (BaseModel) {
  static get tableName() {
    return 'labels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],

      properties: {
        id: { type: 'integer' },
        name: { type: 'string', minLength: 1 },
      },
    };
  }

  static get relationMappings() {
    return {
      tasks: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: path.join(__dirname, 'Task.cjs'),
        join: {
          from: 'labels.id',
          through: {
            from: 'labels_tasks.labelId',
            to: 'labels_tasks.taskId',
          },
          to: 'tasks.id',
        },
      },
    };
  }
};
