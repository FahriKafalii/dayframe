'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('task_tags', {
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
      name: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING(20),
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Tag name unique per user among non-deleted rows.
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX task_tags_user_name_active_key
        ON task_tags (user_id, lower(name))
        WHERE deleted_at IS NULL;
    `);

    await queryInterface.createTable('task_tag_links', {
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'tasks', key: 'id' },
        onDelete: 'CASCADE',
      },
      tag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'task_tags', key: 'id' },
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('task_tag_links', {
      fields: ['task_id', 'tag_id'],
      type: 'primary key',
      name: 'task_tag_links_pkey',
    });
    await queryInterface.addIndex('task_tag_links', ['tag_id'], {
      name: 'task_tag_links_tag_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('task_tag_links');
    await queryInterface.dropTable('task_tags');
  },
};
