'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ----- accounts -----
    await queryInterface.createTable('accounts', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(120), allowNull: false },
      kind: { type: Sequelize.STRING(20), allowNull: false }, // cash|checking|savings|credit_card|debit_card|prepaid|wallet|investment|loan|gold|crypto
      currency: { type: Sequelize.STRING(8), allowNull: false, defaultValue: 'TRY' },
      opening_balance: { type: Sequelize.DECIMAL(18, 4), allowNull: false, defaultValue: 0 },
      opening_date: { type: Sequelize.DATEONLY, allowNull: true },
      color: { type: Sequelize.STRING(20), allowNull: true },
      icon: { type: Sequelize.STRING(40), allowNull: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_archived: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      // credit card subset
      credit_limit: { type: Sequelize.DECIMAL(18, 4), allowNull: true },
      statement_day: { type: Sequelize.INTEGER, allowNull: true },
      due_day: { type: Sequelize.INTEGER, allowNull: true },
      interest_rate: { type: Sequelize.DECIMAL(8, 4), allowNull: true },
      // metadata
      bank_name: { type: Sequelize.STRING(120), allowNull: true },
      last4: { type: Sequelize.STRING(4), allowNull: true },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('accounts', ['user_id', 'deleted_at', 'sort_order'], { name: 'accounts_user_sort_idx' });

    // ----- categories -----
    await queryInterface.createTable('categories', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      parent_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'CASCADE' },
      key: { type: Sequelize.STRING(80), allowNull: false }, // immutable snake_case identity
      type: { type: Sequelize.STRING(20), allowNull: false }, // income|expense|transfer|saving
      kind_default: { type: Sequelize.STRING(20), allowNull: true }, // need|want|saving (50/30/20)
      emoji: { type: Sequelize.STRING(40), allowNull: true },
      color: { type: Sequelize.STRING(20), allowNull: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_system: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      excluded_from_reports: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      i18n: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} }, // { tr: { name }, en: { name } }
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('categories', ['user_id', 'parent_id', 'deleted_at'], { name: 'categories_user_parent_idx' });
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX categories_user_key_active_idx
        ON categories (user_id, key)
        WHERE deleted_at IS NULL;
    `);

    // ----- tags -----
    await queryInterface.createTable('tags', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING(80), allowNull: false },
      color: { type: Sequelize.STRING(20), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX tags_user_name_active_idx
        ON tags (user_id, lower(name))
        WHERE deleted_at IS NULL;
    `);

    // ----- transactions (single ledger) -----
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      user_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      account_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'accounts', key: 'id' }, onDelete: 'RESTRICT' },
      category_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'categories', key: 'id' }, onDelete: 'SET NULL' },
      type: { type: Sequelize.STRING(20), allowNull: false }, // expense|income|transfer_out|transfer_in|adjustment
      amount: { type: Sequelize.DECIMAL(18, 4), allowNull: false }, // always positive; sign comes from type
      currency: { type: Sequelize.STRING(8), allowNull: false },
      fx_rate_to_base: { type: Sequelize.DECIMAL(18, 8), allowNull: true },
      base_amount: { type: Sequelize.DECIMAL(18, 4), allowNull: false }, // denormalized for fast reporting
      occurred_at: { type: Sequelize.DATE, allowNull: false },
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'cleared' }, // planned|pending|cleared|reconciled
      payee: { type: Sequelize.STRING(160), allowNull: true },
      note: { type: Sequelize.TEXT, allowNull: true },
      location: { type: Sequelize.STRING(160), allowNull: true },
      transfer_group_id: { type: Sequelize.UUID, allowNull: true },
      installment_parent_id: { type: Sequelize.UUID, allowNull: true },
      installment_index: { type: Sequelize.INTEGER, allowNull: true }, // 3 of 12
      installment_total: { type: Sequelize.INTEGER, allowNull: true },
      recurring_rule_id: { type: Sequelize.UUID, allowNull: true },
      planned_item_id: { type: Sequelize.UUID, allowNull: true },
      reconciled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      deleted_at: { type: Sequelize.DATE, allowNull: true },
    });
    await queryInterface.addIndex('transactions', ['user_id', 'occurred_at', 'deleted_at'], { name: 'transactions_user_date_idx' });
    await queryInterface.addIndex('transactions', ['user_id', 'account_id', 'occurred_at'], { name: 'transactions_user_account_idx' });
    await queryInterface.addIndex('transactions', ['user_id', 'category_id', 'occurred_at'], { name: 'transactions_user_category_idx' });
    await queryInterface.addIndex('transactions', ['user_id', 'status', 'occurred_at'], { name: 'transactions_user_status_idx' });
    await queryInterface.addIndex('transactions', ['transfer_group_id'], { name: 'transactions_transfer_group_idx' });
    await queryInterface.addIndex('transactions', ['installment_parent_id'], { name: 'transactions_installment_parent_idx' });

    // ----- transaction_tags pivot -----
    await queryInterface.createTable('transaction_tags', {
      transaction_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'transactions', key: 'id' }, onDelete: 'CASCADE' },
      tag_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'tags', key: 'id' }, onDelete: 'CASCADE' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addConstraint('transaction_tags', {
      fields: ['transaction_id', 'tag_id'],
      type: 'primary key',
      name: 'transaction_tags_pkey',
    });

    // ----- user_finance_settings -----
    await queryInterface.createTable('user_finance_settings', {
      user_id: { type: Sequelize.UUID, primaryKey: true, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      base_currency: { type: Sequelize.STRING(8), allowNull: false, defaultValue: 'TRY' },
      week_starts_on: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      month_starts_on: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      default_account_id: { type: Sequelize.UUID, allowNull: true, references: { model: 'accounts', key: 'id' }, onDelete: 'SET NULL' },
      hide_cents: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_finance_settings');
    await queryInterface.dropTable('transaction_tags');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('tags');
    await queryInterface.dropTable('categories');
    await queryInterface.dropTable('accounts');
  },
};
