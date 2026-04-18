'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_journal_links', {
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id',
        },
        onDelete: 'CASCADE',
        primaryKey: true,
      },
      journal_entry_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'journal_entries',
          key: 'id',
        },
        onDelete: 'CASCADE',
        primaryKey: true,
      },
    });

    await queryInterface.addIndex('task_journal_links', ['journal_entry_id'], {
      name: 'task_journal_links_journal_entry_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'task_journal_links',
      'task_journal_links_journal_entry_id_idx'
    );
    await queryInterface.dropTable('task_journal_links');
  },
};