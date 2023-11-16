export const up = async (knex) => (
    await knex.schema.createTable('statuses', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  );
  
export const down = async (knex) => await knex.schema.dropTable('statuses');