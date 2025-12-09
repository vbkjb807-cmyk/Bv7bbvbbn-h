import { connectDB } from "./db";
import {
  User as UserModel,
  Programmer as ProgrammerModel,
  Project as ProjectModel,
  File as FileModel,
  Task as TaskModel,
  Message as MessageModel,
  AiChatMessage as AiChatMessageModel,
  Transaction as TransactionModel,
  AgentLog as AgentLogModel,
  CryptoPayment as CryptoPaymentModel,
  Pricing as PricingModel,
  Template as TemplateModel,
  type IUser,
  type IProgrammer,
  type IProject,
  type IFile,
  type ITask,
  type IMessage,
  type IAiChatMessage,
  type ITransaction,
  type IAgentLog,
  type ICryptoPayment,
  type IPricing,
  type ITemplate,
} from "./models";

function generateUUID(): string {
  return crypto.randomUUID();
}

let dbInitialized = false;

async function ensureDB() {
  if (!dbInitialized) {
    await connectDB();
    dbInitialized = true;
  }
}

connectDB().then(() => {
  dbInitialized = true;
}).catch(console.error);

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
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  loginVerificationCode: string | null;
  loginVerificationExpires: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

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

export type InsertProgrammer = Partial<Programmer>;

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

export type InsertProject = Partial<Project> & { userId: string; title: string; description: string };

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

export type InsertFile = Partial<File> & { projectId: string; filename: string };

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

export type InsertTask = Partial<Task> & { projectId: string; title: string };

export type Message = {
  id: string;
  projectId: string;
  senderId: string;
  receiverId: string | null;
  messageText: string;
  readStatus: boolean | null;
  createdAt: Date | null;
};

export type InsertMessage = Partial<Message> & { projectId: string; senderId: string; messageText: string };

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

export type InsertAiChatMessage = Partial<AiChatMessage> & { projectId: string; userId: string; role: string; content: string };

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

export type InsertTransaction = Partial<Transaction> & { userId: string; type: string; amount: string };

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

export type InsertAgentLog = Partial<AgentLog> & { projectId: string; agentType: string; action: string };

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

export type InsertCryptoPayment = Partial<CryptoPayment> & { userId: string; amountRequested: string };

export type Pricing = {
  id: string;
  agentType: string;
  unit: string;
  rate: string;
  description: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
};

export type InsertPricing = Partial<Pricing> & { agentType: string; unit: string; rate: string };

export type StarterFile = {
  filename: string;
  content: string;
};

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

export type InsertTemplate = Partial<Template> & { name: string; description: string; category: string; language: string };

function toTemplate(doc: ITemplate | null): Template | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    name: doc.name,
    description: doc.description,
    category: doc.category,
    icon: doc.icon,
    language: doc.language,
    framework: doc.framework,
    starterFiles: doc.starterFiles || [],
    isActive: doc.isActive,
    featured: doc.featured,
    createdAt: doc.createdAt,
  };
}

function toUser(doc: IUser | null): User | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    firebaseUid: doc.firebaseUid,
    username: doc.username,
    email: doc.email,
    password: doc.password,
    firstName: doc.firstName,
    lastName: doc.lastName,
    profileImageUrl: doc.profileImageUrl,
    balance: doc.balance,
    role: doc.role,
    isActive: doc.isActive,
    emailVerified: doc.emailVerified,
    emailVerificationToken: doc.emailVerificationToken,
    emailVerificationExpires: doc.emailVerificationExpires,
    passwordResetToken: doc.passwordResetToken,
    passwordResetExpires: doc.passwordResetExpires,
    loginVerificationCode: doc.loginVerificationCode,
    loginVerificationExpires: doc.loginVerificationExpires,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toProgrammer(doc: IProgrammer | null): Programmer | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    userId: doc.userId,
    skills: doc.skills,
    bio: doc.bio,
    hourlyRate: doc.hourlyRate,
    rating: doc.rating,
    totalEarnings: doc.totalEarnings,
    completedTasks: doc.completedTasks,
    available: doc.available,
    isApproved: doc.isApproved,
    createdAt: doc.createdAt,
  };
}

function toProject(doc: IProject | null): Project | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    userId: doc.userId,
    title: doc.title,
    description: doc.description,
    requirements: doc.requirements,
    status: doc.status,
    budget: doc.budget,
    spent: doc.spent,
    aiResult: doc.aiResult,
    programmerId: doc.programmerId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toFile(doc: IFile | null): File | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    projectId: doc.projectId,
    filename: doc.filename,
    filePath: doc.filePath,
    fileType: doc.fileType,
    size: doc.size,
    linesCount: doc.linesCount,
    agentType: doc.agentType,
    status: doc.status,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toTask(doc: ITask | null): Task | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    projectId: doc.projectId,
    programmerId: doc.programmerId,
    fileId: doc.fileId,
    title: doc.title,
    description: doc.description,
    priority: doc.priority,
    startTime: doc.startTime,
    endTime: doc.endTime,
    linesDone: doc.linesDone,
    amountCharged: doc.amountCharged,
    status: doc.status,
    requestedByUser: doc.requestedByUser,
    aiFailedReason: doc.aiFailedReason,
    createdAt: doc.createdAt,
  };
}

function toMessage(doc: IMessage | null): Message | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    projectId: doc.projectId,
    senderId: doc.senderId,
    receiverId: doc.receiverId,
    messageText: doc.messageText,
    readStatus: doc.readStatus,
    createdAt: doc.createdAt,
  };
}

function toAiChatMessage(doc: IAiChatMessage | null): AiChatMessage | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    projectId: doc.projectId,
    userId: doc.userId,
    role: doc.role,
    content: doc.content,
    agentType: doc.agentType,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
  };
}

function toTransaction(doc: ITransaction | null): Transaction | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    userId: doc.userId,
    type: doc.type,
    amount: doc.amount,
    description: doc.description,
    balanceAfter: doc.balanceAfter,
    projectId: doc.projectId,
    cryptoPaymentId: doc.cryptoPaymentId,
    createdAt: doc.createdAt,
  };
}

function toAgentLog(doc: IAgentLog | null): AgentLog | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    projectId: doc.projectId,
    agentType: doc.agentType,
    action: doc.action,
    result: doc.result,
    cost: doc.cost,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

function toCryptoPayment(doc: ICryptoPayment | null): CryptoPayment | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    userId: doc.userId,
    addressIn: doc.addressIn,
    addressOut: doc.addressOut,
    coin: doc.coin,
    amountRequested: doc.amountRequested,
    amountReceived: doc.amountReceived,
    txidIn: doc.txidIn,
    confirmations: doc.confirmations,
    status: doc.status,
    callbackUrl: doc.callbackUrl,
    expiresAt: doc.expiresAt,
    createdAt: doc.createdAt,
    confirmedAt: doc.confirmedAt,
  };
}

function toPricing(doc: IPricing | null): Pricing | undefined {
  if (!doc) return undefined;
  return {
    id: doc._id,
    agentType: doc.agentType,
    unit: doc.unit,
    rate: doc.rate,
    description: doc.description,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(data: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserBalance(id: string, amount: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  setEmailVerified(id: string, verified: boolean): Promise<User | undefined>;

  getProgrammer(id: string): Promise<Programmer | undefined>;
  getProgrammerByUserId(userId: string): Promise<Programmer | undefined>;
  getAvailableProgrammers(): Promise<Programmer[]>;
  getApprovedProgrammers(): Promise<Programmer[]>;
  getPendingProgrammers(): Promise<Programmer[]>;
  createProgrammer(data: Partial<Programmer>): Promise<Programmer>;
  updateProgrammer(id: string, data: Partial<InsertProgrammer>): Promise<Programmer | undefined>;

  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  getProjectsByProgrammerId(programmerId: string): Promise<Project[]>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  getProjectStats(userId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalSpent: string;
  }>;

  getFile(id: string): Promise<File | undefined>;
  getFilesByProjectId(projectId: string): Promise<File[]>;
  createFile(data: InsertFile): Promise<File>;
  updateFile(id: string, data: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: string): Promise<void>;

  getTask(id: string): Promise<Task | undefined>;
  getTasksByProjectId(projectId: string): Promise<Task[]>;
  getTasksByProgrammerId(programmerId: string): Promise<Task[]>;
  getAvailableTasks(): Promise<Task[]>;
  createTask(data: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined>;

  getMessage(id: string): Promise<Message | undefined>;
  getMessagesByProjectId(projectId: string): Promise<Message[]>;
  createMessage(data: InsertMessage): Promise<Message>;
  markMessagesAsRead(projectId: string, userId: string): Promise<void>;

  getAiChatMessagesByProjectId(projectId: string): Promise<AiChatMessage[]>;
  createAiChatMessage(data: InsertAiChatMessage): Promise<AiChatMessage>;

  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: string): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;

  getAgentLog(id: string): Promise<AgentLog | undefined>;
  getAgentLogsByProjectId(projectId: string): Promise<AgentLog[]>;
  createAgentLog(data: InsertAgentLog): Promise<AgentLog>;
  updateAgentLog(id: string, data: Partial<InsertAgentLog>): Promise<AgentLog | undefined>;

  getCryptoPayment(id: string): Promise<CryptoPayment | undefined>;
  getCryptoPaymentByAddress(addressIn: string): Promise<CryptoPayment | undefined>;
  getCryptoPaymentsByUserId(userId: string): Promise<CryptoPayment[]>;
  getPendingCryptoPayments(): Promise<CryptoPayment[]>;
  createCryptoPayment(data: InsertCryptoPayment): Promise<CryptoPayment>;
  updateCryptoPayment(id: string, data: Partial<InsertCryptoPayment>): Promise<CryptoPayment | undefined>;
  confirmPaymentAtomically(
    paymentId: string,
    amountReceived: string,
    txidIn: string,
    confirmations: number
  ): Promise<{ success: boolean; payment?: CryptoPayment; transaction?: Transaction; newBalance?: string }>;

  getPricing(agentType: string, unit: string): Promise<Pricing | undefined>;
  getAllPricing(): Promise<Pricing[]>;
  createPricing(data: InsertPricing): Promise<Pricing>;
  updatePricing(id: string, data: Partial<InsertPricing>): Promise<Pricing | undefined>;

  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  getTemplatesByCategory(category: string): Promise<Template[]>;
  createTemplate(data: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, data: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    await ensureDB();
    const doc = await UserModel.findById(id);
    return toUser(doc);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await ensureDB();
    const doc = await UserModel.findOne({ email });
    return toUser(doc);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await ensureDB();
    const doc = await UserModel.findOne({ username });
    return toUser(doc);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    await ensureDB();
    const doc = await UserModel.findOne({ firebaseUid });
    return toUser(doc);
  }

  async createUser(data: Partial<User>): Promise<User> {
    await ensureDB();
    const doc = await UserModel.create({
      _id: data.id || generateUUID(),
      firebaseUid: data.firebaseUid || null,
      username: data.username || null,
      email: data.email || null,
      password: data.password || null,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      profileImageUrl: data.profileImageUrl || null,
      balance: data.balance || "0.00",
      role: data.role || "client",
      isActive: data.isActive ?? true,
      emailVerified: data.emailVerified ?? false,
      emailVerificationToken: data.emailVerificationToken || null,
      emailVerificationExpires: data.emailVerificationExpires || null,
    });
    return toUser(doc)!;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    await ensureDB();
    if (userData.id) {
      const existing = await this.getUser(userData.id);
      if (existing) {
        const doc = await UserModel.findByIdAndUpdate(
          userData.id,
          {
            username: userData.username !== undefined ? userData.username : existing.username,
            email: userData.email !== undefined ? userData.email : existing.email,
            password: userData.password !== undefined ? userData.password : existing.password,
            firstName: userData.firstName !== undefined ? userData.firstName : existing.firstName,
            lastName: userData.lastName !== undefined ? userData.lastName : existing.lastName,
            profileImageUrl: userData.profileImageUrl !== undefined ? userData.profileImageUrl : existing.profileImageUrl,
            balance: userData.balance !== undefined ? userData.balance : existing.balance,
            role: userData.role !== undefined ? userData.role : existing.role,
            isActive: userData.isActive !== undefined ? userData.isActive : existing.isActive,
            emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : existing.emailVerified,
            updatedAt: new Date(),
          },
          { new: true }
        );
        return toUser(doc)!;
      }
    }
    return this.createUser(userData);
  }

  async updateUserBalance(id: string, amount: string): Promise<User | undefined> {
    await ensureDB();
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;

    const currentBalance = parseFloat(existingUser.balance || "0");
    const newBalance = (currentBalance + parseFloat(amount)).toFixed(2);

    const doc = await UserModel.findByIdAndUpdate(
      id,
      { balance: newBalance, updatedAt: new Date() },
      { new: true }
    );
    return toUser(doc);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.profileImageUrl !== undefined) updateData.profileImageUrl = data.profileImageUrl;
    if (data.balance !== undefined) updateData.balance = data.balance;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
    if (data.emailVerificationToken !== undefined) updateData.emailVerificationToken = data.emailVerificationToken;
    if (data.emailVerificationExpires !== undefined) updateData.emailVerificationExpires = data.emailVerificationExpires;
    if (data.passwordResetToken !== undefined) updateData.passwordResetToken = data.passwordResetToken;
    if (data.passwordResetExpires !== undefined) updateData.passwordResetExpires = data.passwordResetExpires;
    if (data.loginVerificationCode !== undefined) updateData.loginVerificationCode = data.loginVerificationCode;
    if (data.loginVerificationExpires !== undefined) updateData.loginVerificationExpires = data.loginVerificationExpires;

    const doc = await UserModel.findByIdAndUpdate(id, updateData, { new: true });
    return toUser(doc);
  }

  async setEmailVerified(id: string, verified: boolean): Promise<User | undefined> {
    await ensureDB();
    const doc = await UserModel.findByIdAndUpdate(
      id,
      { emailVerified: verified, updatedAt: new Date() },
      { new: true }
    );
    return toUser(doc);
  }

  async getProgrammer(id: string): Promise<Programmer | undefined> {
    await ensureDB();
    const doc = await ProgrammerModel.findById(id);
    return toProgrammer(doc);
  }

  async getProgrammerByUserId(userId: string): Promise<Programmer | undefined> {
    await ensureDB();
    const doc = await ProgrammerModel.findOne({ userId });
    return toProgrammer(doc);
  }

  async getAvailableProgrammers(): Promise<Programmer[]> {
    await ensureDB();
    const docs = await ProgrammerModel.find({ available: true, isApproved: true });
    return docs.map(doc => toProgrammer(doc)!);
  }

  async getApprovedProgrammers(): Promise<Programmer[]> {
    await ensureDB();
    const docs = await ProgrammerModel.find({ isApproved: true });
    return docs.map(doc => toProgrammer(doc)!);
  }

  async getPendingProgrammers(): Promise<Programmer[]> {
    await ensureDB();
    const docs = await ProgrammerModel.find({ isApproved: false });
    return docs.map(doc => toProgrammer(doc)!);
  }

  async createProgrammer(data: Partial<Programmer>): Promise<Programmer> {
    await ensureDB();
    const doc = await ProgrammerModel.create({
      _id: data.id || generateUUID(),
      userId: data.userId!,
      skills: data.skills || null,
      bio: data.bio || null,
      hourlyRate: data.hourlyRate || "25.00",
      rating: data.rating || "0.00",
      totalEarnings: data.totalEarnings || "0.00",
      completedTasks: data.completedTasks || 0,
      available: data.available ?? true,
      isApproved: data.isApproved ?? false,
    });
    return toProgrammer(doc)!;
  }

  async updateProgrammer(id: string, data: Partial<InsertProgrammer>): Promise<Programmer | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = {};
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.totalEarnings !== undefined) updateData.totalEarnings = data.totalEarnings;
    if (data.completedTasks !== undefined) updateData.completedTasks = data.completedTasks;
    if (data.available !== undefined) updateData.available = data.available;
    if (data.isApproved !== undefined) updateData.isApproved = data.isApproved;

    const doc = await ProgrammerModel.findByIdAndUpdate(id, updateData, { new: true });
    return toProgrammer(doc);
  }

  async getProject(id: string): Promise<Project | undefined> {
    await ensureDB();
    const doc = await ProjectModel.findById(id);
    return toProject(doc);
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    await ensureDB();
    const docs = await ProjectModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map(doc => toProject(doc)!);
  }

  async getProjectsByProgrammerId(programmerId: string): Promise<Project[]> {
    await ensureDB();
    const docs = await ProjectModel.find({ programmerId }).sort({ createdAt: -1 });
    return docs.map(doc => toProject(doc)!);
  }

  async createProject(data: InsertProject): Promise<Project> {
    await ensureDB();
    const doc = await ProjectModel.create({
      _id: data.id || generateUUID(),
      userId: data.userId,
      title: data.title,
      description: data.description,
      requirements: data.requirements || null,
      status: data.status || "pending",
      budget: data.budget || "0.00",
      spent: data.spent || "0.00",
      aiResult: data.aiResult || null,
      programmerId: data.programmerId || null,
    });
    return toProject(doc)!;
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.spent !== undefined) updateData.spent = data.spent;
    if (data.aiResult !== undefined) updateData.aiResult = data.aiResult;
    if (data.programmerId !== undefined) updateData.programmerId = data.programmerId;

    const doc = await ProjectModel.findByIdAndUpdate(id, updateData, { new: true });
    return toProject(doc);
  }

  async getProjectStats(userId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalSpent: string;
  }> {
    await ensureDB();
    const userProjects = await ProjectModel.find({ userId });

    const totalProjects = userProjects.length;
    const activeProjects = userProjects.filter(
      (p) => p.status && !["completed", "pending"].includes(p.status)
    ).length;
    const completedProjects = userProjects.filter((p) => p.status === "completed").length;
    const totalSpent = userProjects
      .reduce((sum, p) => sum + parseFloat(p.spent || "0"), 0)
      .toFixed(2);

    return { totalProjects, activeProjects, completedProjects, totalSpent };
  }

  async getFile(id: string): Promise<File | undefined> {
    await ensureDB();
    const doc = await FileModel.findById(id);
    return toFile(doc);
  }

  async getFilesByProjectId(projectId: string): Promise<File[]> {
    await ensureDB();
    const docs = await FileModel.find({ projectId }).sort({ filename: 1 });
    return docs.map(doc => toFile(doc)!);
  }

  async createFile(data: InsertFile): Promise<File> {
    await ensureDB();
    const doc = await FileModel.create({
      _id: data.id || generateUUID(),
      projectId: data.projectId,
      filename: data.filename,
      filePath: data.filePath || null,
      fileType: data.fileType || null,
      size: data.size || 0,
      linesCount: data.linesCount || 0,
      agentType: data.agentType || null,
      status: data.status || "pending",
      content: data.content || null,
    });
    return toFile(doc)!;
  }

  async updateFile(id: string, data: Partial<InsertFile>): Promise<File | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (data.filename !== undefined) updateData.filename = data.filename;
    if (data.filePath !== undefined) updateData.filePath = data.filePath;
    if (data.fileType !== undefined) updateData.fileType = data.fileType;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.linesCount !== undefined) updateData.linesCount = data.linesCount;
    if (data.agentType !== undefined) updateData.agentType = data.agentType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.content !== undefined) updateData.content = data.content;

    const doc = await FileModel.findByIdAndUpdate(id, updateData, { new: true });
    return toFile(doc);
  }

  async deleteFile(id: string): Promise<void> {
    await ensureDB();
    await FileModel.findByIdAndDelete(id);
  }

  async getTask(id: string): Promise<Task | undefined> {
    await ensureDB();
    const doc = await TaskModel.findById(id);
    return toTask(doc);
  }

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    await ensureDB();
    const docs = await TaskModel.find({ projectId }).sort({ createdAt: -1 });
    return docs.map(doc => toTask(doc)!);
  }

  async getTasksByProgrammerId(programmerId: string): Promise<Task[]> {
    await ensureDB();
    const docs = await TaskModel.find({ programmerId }).sort({ createdAt: -1 });
    return docs.map(doc => toTask(doc)!);
  }

  async getAvailableTasks(): Promise<Task[]> {
    await ensureDB();
    const docs = await TaskModel.find({ status: "pending" }).sort({ createdAt: -1 });
    return docs.map(doc => toTask(doc)!);
  }

  async createTask(data: InsertTask): Promise<Task> {
    await ensureDB();
    const doc = await TaskModel.create({
      _id: data.id || generateUUID(),
      projectId: data.projectId,
      programmerId: data.programmerId || null,
      fileId: data.fileId || null,
      title: data.title,
      description: data.description || null,
      priority: data.priority || "medium",
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      linesDone: data.linesDone || 0,
      amountCharged: data.amountCharged || "0.00",
      status: data.status || "pending",
      requestedByUser: data.requestedByUser ?? false,
      aiFailedReason: data.aiFailedReason || null,
    });
    return toTask(doc)!;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = {};
    if (data.programmerId !== undefined) updateData.programmerId = data.programmerId;
    if (data.fileId !== undefined) updateData.fileId = data.fileId;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.linesDone !== undefined) updateData.linesDone = data.linesDone;
    if (data.amountCharged !== undefined) updateData.amountCharged = data.amountCharged;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.requestedByUser !== undefined) updateData.requestedByUser = data.requestedByUser;
    if (data.aiFailedReason !== undefined) updateData.aiFailedReason = data.aiFailedReason;

    const doc = await TaskModel.findByIdAndUpdate(id, updateData, { new: true });
    return toTask(doc);
  }

  async getMessage(id: string): Promise<Message | undefined> {
    await ensureDB();
    const doc = await MessageModel.findById(id);
    return toMessage(doc);
  }

  async getMessagesByProjectId(projectId: string): Promise<Message[]> {
    await ensureDB();
    const docs = await MessageModel.find({ projectId }).sort({ createdAt: 1 });
    return docs.map(doc => toMessage(doc)!);
  }

  async createMessage(data: InsertMessage): Promise<Message> {
    await ensureDB();
    const doc = await MessageModel.create({
      _id: data.id || generateUUID(),
      projectId: data.projectId,
      senderId: data.senderId,
      receiverId: data.receiverId || null,
      messageText: data.messageText,
      readStatus: data.readStatus ?? false,
    });
    return toMessage(doc)!;
  }

  async markMessagesAsRead(projectId: string, userId: string): Promise<void> {
    await ensureDB();
    await MessageModel.updateMany(
      { projectId, receiverId: userId },
      { readStatus: true }
    );
  }

  async getAiChatMessagesByProjectId(projectId: string): Promise<AiChatMessage[]> {
    await ensureDB();
    const docs = await AiChatMessageModel.find({ projectId }).sort({ createdAt: 1 });
    return docs.map(doc => toAiChatMessage(doc)!);
  }

  async createAiChatMessage(data: InsertAiChatMessage): Promise<AiChatMessage> {
    await ensureDB();
    const doc = await AiChatMessageModel.create({
      _id: data.id || generateUUID(),
      projectId: data.projectId,
      userId: data.userId,
      role: data.role,
      content: data.content,
      agentType: data.agentType || null,
      metadata: data.metadata || null,
    });
    return toAiChatMessage(doc)!;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    await ensureDB();
    const doc = await TransactionModel.findById(id);
    return toTransaction(doc);
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    await ensureDB();
    const docs = await TransactionModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map(doc => toTransaction(doc)!);
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    await ensureDB();
    const doc = await TransactionModel.create({
      _id: data.id || generateUUID(),
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      description: data.description || null,
      balanceAfter: data.balanceAfter || null,
      projectId: data.projectId || null,
      cryptoPaymentId: data.cryptoPaymentId || null,
    });
    return toTransaction(doc)!;
  }

  async getAgentLog(id: string): Promise<AgentLog | undefined> {
    await ensureDB();
    const doc = await AgentLogModel.findById(id);
    return toAgentLog(doc);
  }

  async getAgentLogsByProjectId(projectId: string): Promise<AgentLog[]> {
    await ensureDB();
    const docs = await AgentLogModel.find({ projectId }).sort({ createdAt: -1 });
    return docs.map(doc => toAgentLog(doc)!);
  }

  async createAgentLog(data: InsertAgentLog): Promise<AgentLog> {
    await ensureDB();
    const doc = await AgentLogModel.create({
      _id: data.id || generateUUID(),
      projectId: data.projectId,
      agentType: data.agentType,
      action: data.action,
      result: data.result || null,
      cost: data.cost || "0.00",
      status: data.status || "pending",
    });
    return toAgentLog(doc)!;
  }

  async updateAgentLog(id: string, data: Partial<InsertAgentLog>): Promise<AgentLog | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = {};
    if (data.agentType !== undefined) updateData.agentType = data.agentType;
    if (data.action !== undefined) updateData.action = data.action;
    if (data.result !== undefined) updateData.result = data.result;
    if (data.cost !== undefined) updateData.cost = data.cost;
    if (data.status !== undefined) updateData.status = data.status;

    const doc = await AgentLogModel.findByIdAndUpdate(id, updateData, { new: true });
    return toAgentLog(doc);
  }

  async getCryptoPayment(id: string): Promise<CryptoPayment | undefined> {
    await ensureDB();
    const doc = await CryptoPaymentModel.findById(id);
    return toCryptoPayment(doc);
  }

  async getCryptoPaymentByAddress(addressIn: string): Promise<CryptoPayment | undefined> {
    await ensureDB();
    const doc = await CryptoPaymentModel.findOne({ addressIn });
    return toCryptoPayment(doc);
  }

  async getCryptoPaymentsByUserId(userId: string): Promise<CryptoPayment[]> {
    await ensureDB();
    const docs = await CryptoPaymentModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map(doc => toCryptoPayment(doc)!);
  }

  async getPendingCryptoPayments(): Promise<CryptoPayment[]> {
    await ensureDB();
    const docs = await CryptoPaymentModel.find({ status: "pending" });
    return docs.map(doc => toCryptoPayment(doc)!);
  }

  async createCryptoPayment(data: InsertCryptoPayment): Promise<CryptoPayment> {
    await ensureDB();
    const doc = await CryptoPaymentModel.create({
      _id: data.id || generateUUID(),
      userId: data.userId,
      addressIn: data.addressIn || null,
      addressOut: data.addressOut || "TCZwoWnmi8uBssqjtKGmUwAjToAxcJkjLP",
      coin: data.coin || "trc20/usdt",
      amountRequested: data.amountRequested,
      amountReceived: data.amountReceived || "0",
      txidIn: data.txidIn || null,
      confirmations: data.confirmations || 0,
      status: data.status || "pending",
      callbackUrl: data.callbackUrl || null,
      expiresAt: data.expiresAt || null,
      confirmedAt: data.confirmedAt || null,
    });
    return toCryptoPayment(doc)!;
  }

  async updateCryptoPayment(id: string, data: Partial<InsertCryptoPayment>): Promise<CryptoPayment | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = {};
    if (data.addressIn !== undefined) updateData.addressIn = data.addressIn;
    if (data.addressOut !== undefined) updateData.addressOut = data.addressOut;
    if (data.coin !== undefined) updateData.coin = data.coin;
    if (data.amountRequested !== undefined) updateData.amountRequested = data.amountRequested;
    if (data.amountReceived !== undefined) updateData.amountReceived = data.amountReceived;
    if (data.txidIn !== undefined) updateData.txidIn = data.txidIn;
    if (data.confirmations !== undefined) updateData.confirmations = data.confirmations;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.callbackUrl !== undefined) updateData.callbackUrl = data.callbackUrl;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.confirmedAt !== undefined) updateData.confirmedAt = data.confirmedAt;

    const doc = await CryptoPaymentModel.findByIdAndUpdate(id, updateData, { new: true });
    return toCryptoPayment(doc);
  }

  async confirmPaymentAtomically(
    paymentId: string,
    amountReceived: string,
    txidIn: string,
    confirmations: number
  ): Promise<{ success: boolean; payment?: CryptoPayment; transaction?: Transaction; newBalance?: string }> {
    await ensureDB();
    const { mongoose } = await import('./db');
    const session = await mongoose.startSession();
    
    try {
      session.startTransaction();

      const payment = await CryptoPaymentModel.findById(paymentId).session(session);
      if (!payment) {
        await session.abortTransaction();
        return { success: false };
      }

      if (payment.status === 'confirmed') {
        await session.abortTransaction();
        return { success: false };
      }

      payment.amountReceived = amountReceived;
      payment.txidIn = txidIn;
      payment.confirmations = confirmations;
      payment.status = 'confirmed';
      payment.confirmedAt = new Date();
      await payment.save({ session });

      const user = await UserModel.findById(payment.userId).session(session);
      if (!user) {
        await session.abortTransaction();
        return { success: false };
      }

      const currentBalance = parseFloat(user.balance || "0");
      const newBalance = (currentBalance + parseFloat(amountReceived)).toFixed(2);
      user.balance = newBalance;
      await user.save({ session });

      const transaction = await TransactionModel.create([{
        _id: generateUUID(),
        userId: payment.userId,
        type: 'deposit',
        amount: amountReceived,
        description: `Crypto deposit - ${payment.coin}`,
        balanceAfter: newBalance,
        cryptoPaymentId: paymentId,
      }], { session });

      await session.commitTransaction();

      return {
        success: true,
        payment: toCryptoPayment(payment),
        transaction: toTransaction(transaction[0]),
        newBalance,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getPricing(agentType: string, unit: string): Promise<Pricing | undefined> {
    await ensureDB();
    const doc = await PricingModel.findOne({ agentType, unit, isActive: true });
    return toPricing(doc);
  }

  async getAllPricing(): Promise<Pricing[]> {
    await ensureDB();
    const docs = await PricingModel.find({ isActive: true });
    return docs.map(doc => toPricing(doc)!);
  }

  async createPricing(data: InsertPricing): Promise<Pricing> {
    await ensureDB();
    const doc = await PricingModel.create({
      _id: data.id || generateUUID(),
      agentType: data.agentType,
      unit: data.unit,
      rate: data.rate,
      description: data.description || null,
      isActive: data.isActive ?? true,
    });
    return toPricing(doc)!;
  }

  async updatePricing(id: string, data: Partial<InsertPricing>): Promise<Pricing | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = {};
    if (data.agentType !== undefined) updateData.agentType = data.agentType;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const doc = await PricingModel.findByIdAndUpdate(id, updateData, { new: true });
    return toPricing(doc);
  }

  async getTemplates(): Promise<Template[]> {
    await ensureDB();
    const docs = await TemplateModel.find({ isActive: true }).sort({ featured: -1, createdAt: -1 });
    return docs.map(doc => toTemplate(doc)!);
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    await ensureDB();
    const doc = await TemplateModel.findById(id);
    return toTemplate(doc);
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    await ensureDB();
    const docs = await TemplateModel.find({ category, isActive: true }).sort({ featured: -1, createdAt: -1 });
    return docs.map(doc => toTemplate(doc)!);
  }

  async createTemplate(data: InsertTemplate): Promise<Template> {
    await ensureDB();
    const doc = await TemplateModel.create({
      _id: data.id || generateUUID(),
      name: data.name,
      description: data.description,
      category: data.category,
      icon: data.icon || null,
      language: data.language,
      framework: data.framework || null,
      starterFiles: data.starterFiles || [],
      isActive: data.isActive ?? true,
      featured: data.featured ?? false,
    });
    return toTemplate(doc)!;
  }

  async updateTemplate(id: string, data: Partial<InsertTemplate>): Promise<Template | undefined> {
    await ensureDB();
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.framework !== undefined) updateData.framework = data.framework;
    if (data.starterFiles !== undefined) updateData.starterFiles = data.starterFiles;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.featured !== undefined) updateData.featured = data.featured;

    const doc = await TemplateModel.findByIdAndUpdate(id, updateData, { new: true });
    return toTemplate(doc);
  }

  async deleteTemplate(id: string): Promise<void> {
    await ensureDB();
    await TemplateModel.findByIdAndDelete(id);
  }
}

export const storage = new DatabaseStorage();
