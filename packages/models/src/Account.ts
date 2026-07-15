import { DataTypes, Model, type Sequelize } from "sequelize";

export type AccountKind =
  | "cash"
  | "checking"
  | "savings"
  | "credit_card"
  | "debit_card"
  | "prepaid"
  | "wallet"
  | "investment"
  | "loan"
  | "gold"
  | "crypto";

export interface AccountAttributes {
  id: string;
  user_id: string;
  name: string;
  kind: AccountKind;
  currency: string;
  opening_balance: string;
  opening_date: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  is_archived: boolean;
  credit_limit: string | null;
  statement_day: number | null;
  due_day: number | null;
  interest_rate: string | null;
  bank_name: string | null;
  last4: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type AccountCreationAttributes = Omit<
  AccountAttributes,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & { id?: string };

export class Account
  extends Model<AccountAttributes, AccountCreationAttributes>
  implements AccountAttributes
{
  declare id: string;
  declare user_id: string;
  declare name: string;
  declare kind: AccountKind;
  declare currency: string;
  declare opening_balance: string;
  declare opening_date: string | null;
  declare color: string | null;
  declare icon: string | null;
  declare sort_order: number;
  declare is_archived: boolean;
  declare credit_limit: string | null;
  declare statement_day: number | null;
  declare due_day: number | null;
  declare interest_rate: string | null;
  declare bank_name: string | null;
  declare last4: string | null;
  declare notes: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

export function initAccount(sequelize: Sequelize): void {
  Account.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
      user_id: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(120), allowNull: false },
      kind: { type: DataTypes.STRING(20), allowNull: false },
      currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: "TRY" },
      opening_balance: { type: DataTypes.DECIMAL(18, 4), allowNull: false, defaultValue: "0" },
      opening_date: { type: DataTypes.DATEONLY, allowNull: true },
      color: { type: DataTypes.STRING(20), allowNull: true },
      icon: { type: DataTypes.STRING(40), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_archived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      credit_limit: { type: DataTypes.DECIMAL(18, 4), allowNull: true },
      statement_day: { type: DataTypes.INTEGER, allowNull: true },
      due_day: { type: DataTypes.INTEGER, allowNull: true },
      interest_rate: { type: DataTypes.DECIMAL(8, 4), allowNull: true },
      bank_name: { type: DataTypes.STRING(120), allowNull: true },
      last4: { type: DataTypes.STRING(4), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "accounts",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
}
