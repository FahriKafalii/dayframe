'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subtasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
      },
      // Denormalized owner id so every query can be scoped by user without a
      // join. Kept in sync with the parent task's user_id at the service layer.
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      done: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      // Manual ordering within a task. Sparse integers (0,1,2,...) assigned by
      // the service; leaves room to reorder later (Faz 2 pattern).
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('subtasks', ['task_id'], {
      name: 'subtasks_task_id_idx',
    });
    await queryInterface.addIndex('subtasks', ['user_id'], {
      name: 'subtasks_user_id_idx',
    });
    await queryInterface.addIndex('subtasks', ['deleted_at'], {
      name: 'subtasks_deleted_at_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('subtasks');
  },
};
