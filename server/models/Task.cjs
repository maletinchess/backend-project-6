const BaseModel = require('./BaseModel.cjs');
const objectionUnique = require('objection-unique');
const encrypt = require('../lib/secure.cjs');

const unique = objectionUnique({ fields: ['email'] });

module.exports = class Task extends unique(BaseModel) {
    static get tableName() {
      return 'tasks';
    }
  
    static get jsonSchema() {
      return {
        type: 'object',
        required: ['name',  'creatorId'],
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
          relation: Model.BelongsToOneRelation,
          modelClass: path.join(__dirname, 'User'),
          join: {
            from: 'tasks.creatorId',
            to: 'users.id',
          },
        },
        executor: {

        },
        status: {

        }
      }
    }
  
  }