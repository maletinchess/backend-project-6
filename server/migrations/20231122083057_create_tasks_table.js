export const up = async (knex) => {
  const schema = await knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('description');
    table.integer('creator_id').references('id').inTable('users');
    table.integer('status_id').references('id').inTable('statuses');
    table.integer('executor_id').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
  return schema;
};

export const down = async (knex) => {
  const schema = await knex.schema.dropTable('tasks');
  return schema;
};
