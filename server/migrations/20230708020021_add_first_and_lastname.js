export const up  = async (knex) => {
  await knex.schema.table('users', (table) => {
    table.string('first_name');
    table.string('last_name');
  });
};

export const down = (knex) => knex.schema.table('users', (table) => {
    table.dropColumn('first_name');
    table.dropColumn('last_name');
  });
