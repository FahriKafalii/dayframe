import { DataTypes, Model, type Sequelize } from "sequelize";

export interface TransactionTagAttributes {
  transaction_id: string;
  tag_id: string;
  created_at: Date;
}

export class TransactionTag
  extends Model<TransactionTagAttributes>
  implements TransactionTagAttributes
{
  declare transaction_id: string;
  declare tag_id: string;
  declare created_at: Date;
}

export function initTransactionTag(sequelize: Sequelize): void {
  TransactionTag.init(
    {
      transaction_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      tag_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: "transaction_tags",
      timestamps: false,
      underscored: true,
    },
  );
}
