import { UserRepository } from "@/lib/repositories"

export const UserService = {
  async getProfile(userId: string) {
    return UserRepository.findById(userId)
  },

  async updateProfile(userId: string, data: { name?: string; image?: string }) {
    return UserRepository.updateProfile(userId, data)
  },

  async deleteAccount(userId: string) {
    await UserRepository.deleteCascade(userId)
  },

  async getUsage(userId: string) {
    return UserRepository.getUsage(userId)
  },

  async getEvolution(userId: string) {
    const { getSkinEvolution } = await import("./evolution.service")
    return getSkinEvolution(userId)
  },
}
