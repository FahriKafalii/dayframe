import { User, type UserCreationAttributes } from "@dayframe/models";

export const userRepository = {
  async findById(id: string) {
    return User.findByPk(id);
  },

  async findByUsername(username: string) {
    return User.findOne({ where: { username } });
  },

  async create(attrs: UserCreationAttributes) {
    return User.create(attrs);
  },
};
