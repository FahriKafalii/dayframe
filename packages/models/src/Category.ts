import { DataTypes, Model, type Sequelize } from "sequelize";

export type CategoryType = "income" | "expense" | "transfer" | "saving";
export type CategoryKindDefault = "need" | "want" | "saving";

export interface CategoryI18n {
  tr?: { name: string };
  en?: { name: string };
}

export interface CategoryAttributes {
  id: string;
  user_id: string;
  parent_id: string | null;
  key: string;
  type: CategoryType;
  kind_default: CategoryKindDefault | null;
  emoji: string | null;
  color: string | null;
  sort_order: number;
  is_system: boolean;
  excluded_from_reports: boolean;
  i18n: CategoryI18n;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type CategoryCreationAttributes = Omit<
  CategoryAttributes,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & { id?: string };

export class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  declare id: string;
  declare user_id: string;
  declare parent_id: string | null;
  declare key: string;
  declare type: CategoryType;
  declare kind_default: CategoryKindDefault | null;
  declare emoji: string | null;
  declare color: string | null;
  declare sort_order: number;
  declare is_system: boolean;
  declare excluded_from_reports: boolean;
  declare i18n: CategoryI18n;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

export function initCategory(sequelize: Sequelize): void {
  Category.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
      user_id: { type: DataTypes.UUID, allowNull: false },
      parent_id: { type: DataTypes.UUID, allowNull: true },
      key: { type: DataTypes.STRING(80), allowNull: false },
      type: { type: DataTypes.STRING(20), allowNull: false },
      kind_default: { type: DataTypes.STRING(20), allowNull: true },
      emoji: { type: DataTypes.STRING(40), allowNull: true },
      color: { type: DataTypes.STRING(20), allowNull: true },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_system: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      excluded_from_reports: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      i18n: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "categories",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
}
