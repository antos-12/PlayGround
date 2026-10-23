import { Post } from "../domain/Post";
import { ScheduledPost } from "../domain/ScheduledPost";
import type {
  Clock,
  PostRepository,
  ScheduledPostRepository,
} from "../domain/ports";
import { hasFlag, removeKey, setFlag } from "./storage";
import { POSTS_KEY } from "./LocalStoragePostRepository";
import { SCHEDULED_KEY } from "./LocalStorageScheduledPostRepository";

const SEED_KEY = "go-viral:seeded:v1";

interface PostSeed {
  id: string;
  author: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  minutesAgo: number;
}

const POSTS: PostSeed[] = [
  {
    id: "seed-ana-newsletter",
    author: "Ana Torres",
    content:
      "Acabo de lanzar mi newsletter sobre creación de contenido. Primer número mañana. ¿Quién se suma?",
    likes: 184,
    comments: 42,
    shares: 65,
    minutesAgo: 22,
  },
  {
    id: "seed-leo-hook",
    author: "Leo Márquez",
    content:
      "El hook que multiplicó mis vistas 10x: «Nadie te dice esto sobre...»",
    likes: 320,
    comments: 58,
    shares: 91,
    minutesAgo: 100,
  },
  {
    id: "seed-sofia-reels",
    author: "Sofía Reyes",
    content:
      "3 cosas que aprendí grabando 30 reels en 30 días. La tercera me cambió el flujo de trabajo.",
    likes: 512,
    comments: 77,
    shares: 120,
    minutesAgo: 260,
  },
  {
    id: "seed-diego-hilo",
    author: "Diego Vidal",
    content: "Hilo: cómo pasé de 0 a 10k seguidores sin bailar en TikTok.",
    likes: 240,
    comments: 36,
    shares: 58,
    minutesAgo: 55,
  },
  {
    id: "seed-ana-pregunta",
    author: "Ana Torres",
    content:
      "Una pregunta sincera: ¿cuánto tiempo dedicás a pensar el gancho antes de publicar?",
    likes: 96,
    comments: 64,
    shares: 12,
    minutesAgo: 12,
  },
  {
    id: "seed-leo-algoritmo",
    author: "Leo Márquez",
    content: "El algoritmo no te odia. Tu primer segundo sí.",
    likes: 720,
    comments: 90,
    shares: 140,
    minutesAgo: 450,
  },
  {
    id: "seed-sofia-intencion",
    author: "Sofía Reyes",
    content:
      "Publicar todos los días está sobrevalorado. Publicar con intención, no.",
    likes: 66,
    comments: 18,
    shares: 9,
    minutesAgo: 190,
  },
];

interface ScheduledSeed {
  id: string;
  author: string;
  content: string;
  minutesFromNow: number;
}

const SCHEDULED: ScheduledSeed[] = [
  {
    id: "seed-sched-ana-setup",
    author: "Ana Torres",
    content:
      "Detrás de cámara del nuevo setup. Spoiler: hay demasiado café involucrado.",
    minutesFromNow: 105,
  },
  {
    id: "seed-sched-leo-encuesta",
    author: "Leo Márquez",
    content: "Encuesta: ¿qué es lo que más te frena al crear contenido?",
    minutesFromNow: 1_320,
  },
  {
    id: "seed-sched-sofia-serie",
    author: "Sofía Reyes",
    content:
      "Arranca la serie «30 días, 30 ideas». Día 1: encontrar tu ángulo.",
    minutesFromNow: 2_880,
  },
];

export async function seedDemoContent(
  posts: PostRepository,
  scheduled: ScheduledPostRepository,
  clock: Clock,
): Promise<void> {
  if (hasFlag(SEED_KEY)) return;

  const now = clock.now().getTime();
  const [existingPosts, existingScheduled] = await Promise.all([
    posts.findAll(),
    scheduled.findAll(),
  ]);

  if (existingPosts.length === 0) {
    for (const seed of POSTS) {
      await posts.save(
        new Post(
          seed.id,
          seed.author,
          seed.content,
          seed.likes,
          seed.comments,
          seed.shares,
          new Date(now - seed.minutesAgo * 60_000),
        ),
      );
    }
  }

  if (existingScheduled.length === 0) {
    for (const seed of SCHEDULED) {
      await scheduled.save(
        new ScheduledPost(
          seed.id,
          seed.author,
          seed.content,
          new Date(now + seed.minutesFromNow * 60_000),
        ),
      );
    }
  }

  setFlag(SEED_KEY);
}

export async function resetDemoContent(
  posts: PostRepository,
  scheduled: ScheduledPostRepository,
  clock: Clock,
): Promise<void> {
  removeKey(POSTS_KEY);
  removeKey(SCHEDULED_KEY);
  removeKey(SEED_KEY);
  await seedDemoContent(posts, scheduled, clock);
}
