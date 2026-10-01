'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Optional reminder timestamp (with time), distinct from due_date (a day).
    await queryInterface.addColumn('tasks', 'remind_at', {
      type: Sequelize.DATE, // TIMESTAMPTZ
      allowNull: true,
    });
    // Partial index to cheaply find tasks that still have a pending reminder.
    await queryInterface.addIndex('tasks', ['remind_at'], {
      name: 'tasks_remind_at_idx',
      where: { remind_at: { [Sequelize.Op.ne]: null } },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'tasks_remind_at_idx');
    await queryInterface.removeColumn('tasks', 'remind_at');
  },
};
