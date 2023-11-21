export const up = async (knex) => {
  const schema = await knex.schema.createTable('labels', (table) => {
    table.increments('id').primary();
    table.string('name');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
  return schema;
};

export const down = async (knex) => {
  const schema = await knex.schema.dropTable('labels');
  return schema;
};
