'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tasks', {
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'OPEN',
      },
      priority: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'MED',
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      completed_at: {
        type: Sequelize.DATE,
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

    await queryInterface.addConstraint('tasks', {
      fields: ['status'],
      type: 'check',
      name: 'tasks_status_check',
      where: {
        status: ['OPEN', 'DONE', 'CANCELED'],
      },
    });

    await queryInterface.addConstraint('tasks', {
      fields: ['priority'],
      type: 'check',
      name: 'tasks_priority_check',
      where: {
        priority: ['LOW', 'MED', 'HIGH'],
      },
    });

    await queryInterface.addIndex('tasks', ['user_id', 'due_date']);
    await queryInterface.addIndex('tasks', ['user_id', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tasks');
  },
};