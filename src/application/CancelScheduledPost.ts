import type { Notifier, ScheduledPostRepository } from "../domain/ports";

export class CancelScheduledPost {
  constructor(
    private readonly repo: ScheduledPostRepository,
    private readonly notifier: Notifier,
  ) {}

  async execute(id: string): Promise<void> {
    const item = await this.repo.findById(id);
    if (!item) throw new Error("Publicación programada no encontrada.");

    await this.repo.remove(id);
    this.notifier.notify("Programación cancelada", "warn");
  }
}
