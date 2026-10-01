'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Simple recurrence rule. When a recurring task is completed, the service
    // spawns the next occurrence (due_date/remind_at shifted by the interval).
    await queryInterface.addColumn('tasks', 'recurrence', {
      type: Sequelize.STRING(10),
      allowNull: true, // null = one-off (no recurrence)
    });
    await queryInterface.addConstraint('tasks', {
      fields: ['recurrence'],
      type: 'check',
      name: 'tasks_recurrence_check',
      where: {
        recurrence: [null, 'daily', 'weekly', 'monthly'],
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint('tasks', 'tasks_recurrence_check');
    await queryInterface.removeColumn('tasks', 'recurrence');
  },
};
