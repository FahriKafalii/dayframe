'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE tasks
      SET completed_at = COALESCE(completed_at, updated_at)
      WHERE status = 'DONE' AND completed_at IS NULL;
    `);

    await queryInterface.sequelize.query(`
      UPDATE tasks
      SET completed_at = NULL
      WHERE status <> 'DONE' AND completed_at IS NOT NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE tasks
        ADD CONSTRAINT tasks_completed_at_consistency_check
        CHECK (
          (status = 'DONE' AND completed_at IS NOT NULL)
          OR (status <> 'DONE' AND completed_at IS NULL)
        );
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_completed_at_consistency_check;'
    );
  },
};
