'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    });
    await queryInterface.addColumn('users', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('tasks', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('journal_entries', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('tasks', ['deleted_at'], {
      name: 'tasks_deleted_at_idx',
    });
    await queryInterface.addIndex('journal_entries', ['deleted_at'], {
      name: 'journal_entries_deleted_at_idx',
    });

    await queryInterface.removeConstraint(
      'journal_entries',
      'journal_entries_user_id_date_key'
    );
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX journal_entries_user_id_date_active_key
        ON journal_entries (user_id, date)
        WHERE deleted_at IS NULL;
    `);

    await queryInterface.sequelize.query(
      'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;'
    );
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX users_username_active_key
        ON users (username)
        WHERE deleted_at IS NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS users_username_active_key;'
    );
    await queryInterface.addConstraint('users', {
      fields: ['username'],
      type: 'unique',
      name: 'users_username_key',
    });

    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS journal_entries_user_id_date_active_key;'
    );
    await queryInterface.addConstraint('journal_entries', {
      fields: ['user_id', 'date'],
      type: 'unique',
      name: 'journal_entries_user_id_date_key',
    });

    await queryInterface.removeIndex(
      'journal_entries',
      'journal_entries_deleted_at_idx'
    );
    await queryInterface.removeIndex('tasks', 'tasks_deleted_at_idx');

    await queryInterface.removeColumn('journal_entries', 'deleted_at');
    await queryInterface.removeColumn('tasks', 'deleted_at');
    await queryInterface.removeColumn('users', 'deleted_at');
    await queryInterface.removeColumn('users', 'updated_at');
  },
};
