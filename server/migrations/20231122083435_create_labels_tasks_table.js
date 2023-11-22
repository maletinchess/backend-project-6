export const up = async (knex) => {
  const schema = await knex.schema.createTable('labels_tasks', (table) => {
    table.integer('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.integer('label_id').references('id').inTable('labels').onDelete('CASCADE');
  });
  return schema;
};

export const down = async (knex) => {
  const schema = await knex.schema.dropTable('labels_tasks');
  return schema;
};
