'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('journal_entries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      mood: {
        type: Sequelize.SMALLINT,
        allowNull: true,
      },
      wins: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      blockers: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    });

    await queryInterface.addConstraint('journal_entries', {
      fields: ['user_id', 'date'],
      type: 'unique',
      name: 'journal_entries_user_id_date_key',
    });

    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'journal_entries_mood_check'
        ) THEN
          ALTER TABLE journal_entries
            ADD CONSTRAINT journal_entries_mood_check
            CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5));
        END IF;
      END $$;
      `);

    await queryInterface.addIndex('journal_entries', ['user_id', 'date'], {
      name: 'journal_entries_user_id_date_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('journal_entries', 'journal_entries_user_id_date_idx');
    await queryInterface.sequelize.query(
      'ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_mood_check;'
    );
    await queryInterface.removeConstraint('journal_entries', 'journal_entries_user_id_date_key');
    await queryInterface.dropTable('journal_entries');
  },
};
