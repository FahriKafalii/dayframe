'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Manual ordering for tasks. Nullable so existing rows keep created_at order
    // until first reorder; backfilled below with a stable initial sequence.
    await queryInterface.addColumn('tasks', 'position', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Backfill: assign positions per user, ordered by created_at (newest first,
    // matching the current default list order), spaced by 1000 so future
    // fractional inserts have room.
    await queryInterface.sequelize.query(`
      WITH ordered AS (
        SELECT id,
               (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1) * 1000 AS pos
        FROM tasks
      )
      UPDATE tasks t
      SET position = o.pos
      FROM ordered o
      WHERE t.id = o.id;
    `);

    await queryInterface.addIndex('tasks', ['user_id', 'position'], {
      name: 'tasks_user_id_position_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('tasks', 'tasks_user_id_position_idx');
    await queryInterface.removeColumn('tasks', 'position');
  },
};
