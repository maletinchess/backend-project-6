export const up = async (knex) => {
    await knex.schema.createTable('tasks_labels', (table) => {
      table.integer('task_id').references('id').inTable('tasks').onDelete('CASCADE');
      table.integer('label_id').references('id').inTable('labels').onDelete('CASCADE');
    });
  };
  
  export const down = (knex) => knex.schema.dropTable('tasks_labels');