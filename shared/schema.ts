import { z } from "zod";

function generateUUID(): string {
  return crypto.randomUUID();
}

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["client", "programmer"]).default("client"),
});

export const firebaseRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["client", "programmer"]).default("client"),
  firebaseUid: z.string().min(1, "Firebase UID is required"),
});

export const firebaseProgrammerRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  firebaseUid: z.string().min(1, "Firebase UID is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  hourlyRate: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const programmerRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  hourlyRate: z.string().optional(),
});

export const insertUserSchema = z.object({
  id: z.string().default(() => generateUUID()),
  firebaseUid: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  balance: z.string().default("0.00"),
  role: z.string().default("client"),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  emailVerificationToken: z.string().nullable().optional(),
  emailVerificationExpires: z.date().nullable().optional(),
});

export const insertProgrammerSchema = z.object({
  id: z.string().default(() => generateUUID()),
  userId: z.string(),
  skills: z.array(z.string()).nullable().optional(),
  bio: z.string().nullable().optional(),
  hourlyRate: z.string().default("25.00"),
  rating: z.string().default("0.00"),
  totalEarnings: z.string().default("0.00"),
  completedTasks: z.number().default(0),
  available: z.boolean().default(true),
  isApproved: z.boolean().default(false),
});

export const insertProjectSchema = z.object({
  id: z.string().default(() => generateUUID()),
  userId: z.string(),
  title: z.string(),
  description: z.string(),
  requirements: z.string().nullable().optional(),
  status: z.string().default("pending"),
  budget: z.string().default("0.00"),
  spent: z.string().default("0.00"),
  aiResult: z.string().nullable().optional(),
  programmerId: z.string().nullable().optional(),
});

export const insertFileSchema = z.object({
  id: z.string().default(() => generateUUID()),
  projectId: z.string(),
  filename: z.string(),
  filePath: z.string().nullable().optional(),
  fileType: z.string().nullable().optional(),
  size: z.number().default(0),
  linesCount: z.number().default(0),
  agentType: z.string().nullable().optional(),
  status: z.string().default("pending"),
  content: z.string().nullable().optional(),
});

export const insertTaskSchema = z.object({
  id: z.string().default(() => generateUUID()),
  projectId: z.string(),
  programmerId: z.string().nullable().optional(),
  fileId: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  priority: z.string().default("medium"),
  startTime: z.date().nullable().optional(),
  endTime: z.date().nullable().optional(),
  linesDone: z.number().default(0),
  amountCharged: z.string().default("0.00"),
  status: z.string().default("pending"),
  requestedByUser: z.boolean().default(false),
  aiFailedReason: z.string().nullable().optional(),
});

export const insertMessageSchema = z.object({
  id: z.string().default(() => generateUUID()),
  projectId: z.string(),
  senderId: z.string(),
  receiverId: z.string().nullable().optional(),
  messageText: z.string(),
  readStatus: z.boolean().default(false),
});

export const insertAiChatMessageSchema = z.object({
  id: z.string().default(() => generateUUID()),
  projectId: z.string(),
  userId: z.string(),
  role: z.string(),
  content: z.string(),
  agentType: z.string().nullable().optional(),
  metadata: z.any().nullable().optional(),
});

export const insertTransactionSchema = z.object({
  id: z.string().default(() => generateUUID()),
  userId: z.string(),
  type: z.string(),
  amount: z.string(),
  description: z.string().nullable().optional(),
  balanceAfter: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  cryptoPaymentId: z.string().nullable().optional(),
});

export const insertAgentLogSchema = z.object({
  id: z.string().default(() => generateUUID()),
  projectId: z.string(),
  agentType: z.string(),
  action: z.string(),
  result: z.string().nullable().optional(),
  cost: z.string().default("0.00"),
  status: z.string().default("pending"),
});

export const insertCryptoPaymentSchema = z.object({
  id: z.string().default(() => generateUUID()),
  userId: z.string(),
  addressIn: z.string().nullable().optional(),
  addressOut: z.string().default("TCZwoWnmi8uBssqjtKGmUwAjToAxcJkjLP"),
  coin: z.string().default("trc20/usdt"),
  amountRequested: z.string(),
  amountReceived: z.string().default("0"),
  txidIn: z.string().nullable().optional(),
  confirmations: z.number().default(0),
  status: z.string().default("pending"),
  callbackUrl: z.string().nullable().optional(),
  expiresAt: z.date().nullable().optional(),
  confirmedAt: z.date().nullable().optional(),
});

export const insertPricingSchema = z.object({
  id: z.string().default(() => generateUUID()),
  agentType: z.string(),
  unit: z.string(),
  rate: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type User = {
  id: string;
  firebaseUid: string | null;
  username: string | null;
  email: string | null;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  balance: string | null;
  role: string | null;
  isActive: boolean | null;
  emailVerified: boolean | null;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = Partial<User> & { id?: string };

export type Programmer = {
  id: string;
  userId: string;
  skills: string[] | null;
  bio: string | null;
  hourlyRate: string | null;
  rating: string | null;
  totalEarnings: string | null;
  completedTasks: number | null;
  available: boolean | null;
  isApproved: boolean | null;
  createdAt: Date | null;
};

export type InsertProgrammer = z.infer<typeof insertProgrammerSchema>;

export type Project = {
  id: string;
  userId: string;
  title: string;
  description: string;
  requirements: string | null;
  status: string | null;
  budget: string | null;
  spent: string | null;
  aiResult: string | null;
  programmerId: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type InsertProject = z.infer<typeof insertProjectSchema>;

export type File = {
  id: string;
  projectId: string;
  filename: string;
  filePath: string | null;
  fileType: string | null;
  size: number | null;
  linesCount: number | null;
  agentType: string | null;
  status: string | null;
  content: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type InsertFile = z.infer<typeof insertFileSchema>;

export type Task = {
  id: string;
  projectId: string;
  programmerId: string | null;
  fileId: string | null;
  title: string;
  description: string | null;
  priority: string | null;
  startTime: Date | null;
  endTime: Date | null;
  linesDone: number | null;
  amountCharged: string | null;
  status: string | null;
  requestedByUser: boolean | null;
  aiFailedReason: string | null;
  createdAt: Date | null;
};

export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Message = {
  id: string;
  projectId: string;
  senderId: string;
  receiverId: string | null;
  messageText: string;
  readStatus: boolean | null;
  createdAt: Date | null;
};

export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type AiChatMessage = {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  content: string;
  agentType: string | null;
  metadata: any;
  createdAt: Date | null;
};

export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;

export type Transaction = {
  id: string;
  userId: string;
  type: string;
  amount: string;
  description: string | null;
  balanceAfter: string | null;
  projectId: string | null;
  cryptoPaymentId: string | null;
  createdAt: Date | null;
};

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type AgentLog = {
  id: string;
  projectId: string;
  agentType: string;
  action: string;
  result: string | null;
  cost: string | null;
  status: string | null;
  createdAt: Date | null;
};

export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;

export type CryptoPayment = {
  id: string;
  userId: string;
  addressIn: string | null;
  addressOut: string | null;
  coin: string | null;
  amountRequested: string;
  amountReceived: string | null;
  txidIn: string | null;
  confirmations: number | null;
  status: string | null;
  callbackUrl: string | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  confirmedAt: Date | null;
};

export type InsertCryptoPayment = z.infer<typeof insertCryptoPaymentSchema>;

export type Pricing = {
  id: string;
  agentType: string;
  unit: string;
  rate: string;
  description: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
};

export type InsertPricing = z.infer<typeof insertPricingSchema>;

export const starterFileSchema = z.object({
  filename: z.string(),
  content: z.string(),
});

export const insertTemplateSchema = z.object({
  id: z.string().default(() => generateUUID()),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  icon: z.string().nullable().optional(),
  language: z.string(),
  framework: z.string().nullable().optional(),
  starterFiles: z.array(starterFileSchema).default([]),
  isActive: z.boolean().default(true),
  featured: z.boolean().default(false),
});

export type StarterFile = z.infer<typeof starterFileSchema>;

export type Template = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  language: string;
  framework: string | null;
  starterFiles: StarterFile[];
  isActive: boolean | null;
  featured: boolean | null;
  createdAt: Date | null;
};

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProgrammerRegisterInput = z.infer<typeof programmerRegisterSchema>;
export type FirebaseRegisterInput = z.infer<typeof firebaseRegisterSchema>;
export type FirebaseProgrammerRegisterInput = z.infer<typeof firebaseProgrammerRegisterSchema>;
