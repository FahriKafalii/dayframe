'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_groups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      // Self-reference for nesting (group inside group). Null = root group.
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'task_groups', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
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

    await queryInterface.addIndex('task_groups', ['user_id'], {
      name: 'task_groups_user_id_idx',
    });
    await queryInterface.addIndex('task_groups', ['parent_id'], {
      name: 'task_groups_parent_id_idx',
    });

    // Tasks can belong to a group (null = "Inbox", ungrouped).
    await queryInterface.addColumn('tasks', 'group_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: 'task_groups', key: 'id' },
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('tasks', ['group_id'], {
      name: 'tasks_group_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'tasks_group_id_idx');
    await queryInterface.removeColumn('tasks', 'group_id');
    await queryInterface.dropTable('task_groups');
  },
};
