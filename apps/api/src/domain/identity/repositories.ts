import type { UUID } from "@scholva/shared-types";
import type { User } from "./entities.js";

export interface IUserRepository {
  findById(id: UUID): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
