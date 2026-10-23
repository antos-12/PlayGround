export interface PostSnapshot {
  id: string;
  author: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

const MAX_CONTENT = 280;

export class Post {
  readonly id: string;
  readonly author: string;
  readonly content: string;
  readonly createdAt: Date;
  private _likes: number;
  private _comments: number;
  private _shares: number;

  constructor(
    id: string,
    author: string,
    content: string,
    likes = 0,
    comments = 0,
    shares = 0,
    createdAt = new Date(),
  ) {
    const cleanAuthor = author.trim();
    const cleanContent = content.trim();

    if (!id.trim()) throw new Error("La publicación necesita un identificador.");
    if (!cleanAuthor) throw new Error("El autor no puede estar vacío.");
    if (!cleanContent) throw new Error("El contenido no puede estar vacío.");
    if (cleanContent.length > MAX_CONTENT)
      throw new Error(`Máximo ${MAX_CONTENT} caracteres.`);
    if ([likes, comments, shares].some((value) => !Number.isFinite(value) || value < 0))
      throw new Error("Las métricas no pueden ser negativas.");
    if (Number.isNaN(createdAt.getTime()))
      throw new Error("La fecha de creación no es válida.");

    this.id = id;
    this.author = cleanAuthor;
    this.content = cleanContent;
    this.createdAt = createdAt;
    this._likes = Math.round(likes);
    this._comments = Math.round(comments);
    this._shares = Math.round(shares);
  }

  get likes(): number {
    return this._likes;
  }

  get comments(): number {
    return this._comments;
  }

  get shares(): number {
    return this._shares;
  }

  get engagement(): number {
    return this._likes + this._comments * 2 + this._shares * 3;
  }

  get ageInHours(): number {
    return (Date.now() - this.createdAt.getTime()) / 3_600_000;
  }

  like(): void {
    this._likes += 1;
  }

  comment(): void {
    this._comments += 1;
  }

  share(): void {
    this._shares += 1;
  }

  viralScore(now = new Date()): number {
    const hours = (now.getTime() - this.createdAt.getTime()) / 3_600_000 + 2;
    const safeHours = Math.max(hours, 0.25);
    return this.engagement / Math.pow(safeHours, 1.5);
  }

  snapshot(): PostSnapshot {
    return {
      id: this.id,
      author: this.author,
      content: this.content,
      likes: this._likes,
      comments: this._comments,
      shares: this._shares,
      createdAt: this.createdAt.toISOString(),
    };
  }

  static fromSnapshot(snapshot: PostSnapshot): Post {
    return new Post(
      snapshot.id,
      snapshot.author,
      snapshot.content,
      snapshot.likes,
      snapshot.comments,
      snapshot.shares,
      new Date(snapshot.createdAt),
    );
  }
}
