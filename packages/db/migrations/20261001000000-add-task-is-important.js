'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Star / "important" flag (Microsoft To Do style). Drives the Important view.
    await queryInterface.addColumn('tasks', 'is_important', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addIndex('tasks', ['user_id', 'is_important'], {
      name: 'tasks_user_important_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'tasks_user_important_idx');
    await queryInterface.removeColumn('tasks', 'is_important');
  },
};
