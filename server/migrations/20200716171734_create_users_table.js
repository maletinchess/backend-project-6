// @ts-check
export const up = async (knex) => {
  const schema = await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('first_name');
    table.string('last_name');
    table.string('email');
    table.string('password_digest');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  return schema;
};

export const down = async (knex) => {
  const schema = knex.schema.dropTable('users');
  return schema;
};
