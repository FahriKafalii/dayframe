import { DataTypes, Model, type Sequelize } from "sequelize";

export type TransactionType =
  | "expense"
  | "income"
  | "transfer_out"
  | "transfer_in"
  | "adjustment";
export type TransactionStatus = "planned" | "pending" | "cleared" | "reconciled";

export interface TransactionAttributes {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: string; // positive numeric stored as string for precision
  currency: string;
  fx_rate_to_base: string | null;
  base_amount: string;
  occurred_at: Date;
  status: TransactionStatus;
  payee: string | null;
  note: string | null;
  location: string | null;
  transfer_group_id: string | null;
  installment_parent_id: string | null;
  installment_index: number | null;
  installment_total: number | null;
  recurring_rule_id: string | null;
  planned_item_id: string | null;
  reconciled_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type TransactionCreationAttributes = Omit<
  TransactionAttributes,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & { id?: string };

export class Transaction
  extends Model<TransactionAttributes, TransactionCreationAttributes>
  implements TransactionAttributes
{
  declare id: string;
  declare user_id: string;
  declare account_id: string;
  declare category_id: string | null;
  declare type: TransactionType;
  declare amount: string;
  declare currency: string;
  declare fx_rate_to_base: string | null;
  declare base_amount: string;
  declare occurred_at: Date;
  declare status: TransactionStatus;
  declare payee: string | null;
  declare note: string | null;
  declare location: string | null;
  declare transfer_group_id: string | null;
  declare installment_parent_id: string | null;
  declare installment_index: number | null;
  declare installment_total: number | null;
  declare recurring_rule_id: string | null;
  declare planned_item_id: string | null;
  declare reconciled_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

export function initTransaction(sequelize: Sequelize): void {
  Transaction.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
      user_id: { type: DataTypes.UUID, allowNull: false },
      account_id: { type: DataTypes.UUID, allowNull: false },
      category_id: { type: DataTypes.UUID, allowNull: true },
      type: { type: DataTypes.STRING(20), allowNull: false },
      amount: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
      currency: { type: DataTypes.STRING(8), allowNull: false },
      fx_rate_to_base: { type: DataTypes.DECIMAL(18, 8), allowNull: true },
      base_amount: { type: DataTypes.DECIMAL(18, 4), allowNull: false },
      occurred_at: { type: DataTypes.DATE, allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "cleared" },
      payee: { type: DataTypes.STRING(160), allowNull: true },
      note: { type: DataTypes.TEXT, allowNull: true },
      location: { type: DataTypes.STRING(160), allowNull: true },
      transfer_group_id: { type: DataTypes.UUID, allowNull: true },
      installment_parent_id: { type: DataTypes.UUID, allowNull: true },
      installment_index: { type: DataTypes.INTEGER, allowNull: true },
      installment_total: { type: DataTypes.INTEGER, allowNull: true },
      recurring_rule_id: { type: DataTypes.UUID, allowNull: true },
      planned_item_id: { type: DataTypes.UUID, allowNull: true },
      reconciled_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "transactions",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
}
