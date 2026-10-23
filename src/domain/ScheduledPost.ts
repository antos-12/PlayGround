export interface ScheduledPostSnapshot {
  id: string;
  author: string;
  content: string;
  publishAt: string;
}

export class ScheduledPost {
  readonly id: string;
  readonly author: string;
  readonly content: string;
  readonly publishAt: Date;

  constructor(id: string, author: string, content: string, publishAt: Date) {
    const cleanAuthor = author.trim();
    const cleanContent = content.trim();

    if (!id.trim()) throw new Error("La programación necesita un identificador.");
    if (!cleanAuthor) throw new Error("El autor no puede estar vacío.");
    if (!cleanContent) throw new Error("El contenido no puede estar vacío.");
    if (cleanContent.length > 280) throw new Error("Máximo 280 caracteres.");
    if (Number.isNaN(publishAt.getTime()))
      throw new Error("La fecha de publicación no es válida.");

    this.id = id;
    this.author = cleanAuthor;
    this.content = cleanContent;
    this.publishAt = publishAt;
  }

  isDue(now = new Date()): boolean {
    return this.publishAt.getTime() <= now.getTime();
  }

  snapshot(): ScheduledPostSnapshot {
    return {
      id: this.id,
      author: this.author,
      content: this.content,
      publishAt: this.publishAt.toISOString(),
    };
  }

  static fromSnapshot(snapshot: ScheduledPostSnapshot): ScheduledPost {
    return new ScheduledPost(
      snapshot.id,
      snapshot.author,
      snapshot.content,
      new Date(snapshot.publishAt),
    );
  }
}
