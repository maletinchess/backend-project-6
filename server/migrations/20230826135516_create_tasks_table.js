export const up = (knex) => (
    knex.schema.createTable('tasks', (table) => {
      table.increments('id').primary();
      table.string('name');
      table.integer('creatorId').references('id').inTable('users');
      table.integer('statusId').references('id').inTable('statuses');
      table.integer('executorId').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
  );
  
export const down = (knex) => knex.schema.dropTable('users');
