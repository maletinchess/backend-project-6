// @ts-check
export const up =  async (knex) => (
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('email');
    table.string('password_digest');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  })
);

export const down = async (knex) => await knex.schema.dropTableifExists('users');
