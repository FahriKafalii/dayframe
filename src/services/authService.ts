import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { userRepository } from "@/repositories/userRepository";
import { AppError } from "@/lib/errors";

const SALT_ROUNDS = 12;

export const authService = {
  async register(username: string, password: string) {
    const existing = await userRepository.findByUsername(username);
    if (existing) {
      throw new AppError("CONFLICT", "Username already taken");
    }

    const id = randomUUID();
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await userRepository.create({ id, username, password_hash });
    return { id: user.id, username: user.username };
  },

  async login(username: string, password: string) {
    const user = await userRepository.findByUsername(username);
    if (!user) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError("UNAUTHORIZED", "Invalid credentials");
    }

    return { id: user.id, username: user.username };
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("NOT_FOUND", "User not found");
    }
    return { id: user.id, username: user.username };
  },
};
