import { type Task, type InsertTask, type User, type InsertUser } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getTasks(userId: number): Promise<Task[]>;
  createTask(task: InsertTask & { userId: number }): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User>;
  getUserByUsername(username: string): Promise<User | null>;

  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private tasks: Map<number, Task>;
  private users: Map<number, User>;
  private currentTaskId: number;
  private currentUserId: number;
  readonly sessionStore: session.Store;

  constructor() {
    this.tasks = new Map();
    this.users = new Map();
    this.currentTaskId = 1;
    this.currentUserId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }

  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  async createTask(insertTask: InsertTask & { userId: number }): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      ...insertTask,
      id,
      completed: insertTask.completed ?? false,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error("Task not found");
    }
    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    if (!this.tasks.has(id)) {
      throw new Error("Task not found");
    }
    this.tasks.delete(id);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      ...insertUser,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(
      (u) => u.username === username
    );
    return user || null;
  }
}

export const storage = new MemStorage();