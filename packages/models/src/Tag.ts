import { DataTypes, Model, type Sequelize } from "sequelize";

export interface TagAttributes {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type TagCreationAttributes = Omit<
  TagAttributes,
  "id" | "created_at" | "updated_at" | "deleted_at"
> & { id?: string };

export class Tag extends Model<TagAttributes, TagCreationAttributes> implements TagAttributes {
  declare id: string;
  declare user_id: string;
  declare name: string;
  declare color: string | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | null;
}

export function initTag(sequelize: Sequelize): void {
  Tag.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false, defaultValue: DataTypes.UUIDV4 },
      user_id: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      color: { type: DataTypes.STRING(20), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      deleted_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: "tags",
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
  );
}
