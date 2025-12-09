import mongoose, { Schema, Document } from 'mongoose';

// User Model
export interface IUser extends Document {
  _id: string;
  firebaseUid: string | null;
  username: string | null;
  email: string | null;
  password: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  balance: string;
  role: string | null;
  isActive: boolean;
  emailVerified: boolean;
  emailVerificationToken: string | null;
  emailVerificationExpires: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  loginVerificationCode: string | null;
  loginVerificationExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  firebaseUid: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  profileImageUrl: { type: String },
  balance: { type: String, default: "0.00" },
  role: { type: String, default: "client" },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  loginVerificationCode: { type: String },
  loginVerificationExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

export const User = mongoose.model<IUser>('User', userSchema);

// Programmer Model
export interface IProgrammer extends Document {
  _id: string;
  userId: string;
  skills: string[] | null;
  bio: string | null;
  hourlyRate: string;
  rating: string;
  totalEarnings: string;
  completedTasks: number;
  available: boolean;
  isApproved: boolean;
  createdAt: Date;
}

const programmerSchema = new Schema<IProgrammer>({
  _id: { type: String, required: true },
  userId: { type: String, required: true, ref: 'User' },
  skills: { type: [String] },
  bio: { type: String },
  hourlyRate: { type: String, default: "25.00" },
  rating: { type: String, default: "0.00" },
  totalEarnings: { type: String, default: "0.00" },
  completedTasks: { type: Number, default: 0 },
  available: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

programmerSchema.index({ userId: 1 });
programmerSchema.index({ available: 1, isApproved: 1 });

export const Programmer = mongoose.model<IProgrammer>('Programmer', programmerSchema);

// Project Model
export interface IProject extends Document {
  _id: string;
  userId: string;
  title: string;
  description: string;
  requirements: string | null;
  status: string | null;
  budget: string;
  spent: string;
  aiResult: string | null;
  programmerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
  _id: { type: String, required: true },
  userId: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String },
  status: { type: String, default: "pending" },
  budget: { type: String, default: "0.00" },
  spent: { type: String, default: "0.00" },
  aiResult: { type: String },
  programmerId: { type: String, ref: 'Programmer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

projectSchema.index({ userId: 1 });
projectSchema.index({ programmerId: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);

// File Model
export interface IFile extends Document {
  _id: string;
  projectId: string;
  filename: string;
  filePath: string | null;
  fileType: string | null;
  size: number;
  linesCount: number;
  agentType: string | null;
  status: string | null;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, ref: 'Project' },
  filename: { type: String, required: true },
  filePath: { type: String },
  fileType: { type: String },
  size: { type: Number, default: 0 },
  linesCount: { type: Number, default: 0 },
  agentType: { type: String },
  status: { type: String, default: "pending" },
  content: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

fileSchema.index({ projectId: 1 });

export const File = mongoose.model<IFile>('File', fileSchema);

// Task Model
export interface ITask extends Document {
  _id: string;
  projectId: string;
  programmerId: string | null;
  fileId: string | null;
  title: string;
  description: string | null;
  priority: string | null;
  startTime: Date | null;
  endTime: Date | null;
  linesDone: number;
  amountCharged: string;
  status: string | null;
  requestedByUser: boolean;
  aiFailedReason: string | null;
  createdAt: Date;
}

const taskSchema = new Schema<ITask>({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, ref: 'Project' },
  programmerId: { type: String, ref: 'Programmer' },
  fileId: { type: String, ref: 'File' },
  title: { type: String, required: true },
  description: { type: String },
  priority: { type: String, default: "medium" },
  startTime: { type: Date },
  endTime: { type: Date },
  linesDone: { type: Number, default: 0 },
  amountCharged: { type: String, default: "0.00" },
  status: { type: String, default: "pending" },
  requestedByUser: { type: Boolean, default: false },
  aiFailedReason: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

taskSchema.index({ projectId: 1 });
taskSchema.index({ programmerId: 1 });
taskSchema.index({ status: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);

// Message Model
export interface IMessage extends Document {
  _id: string;
  projectId: string;
  senderId: string;
  receiverId: string | null;
  messageText: string;
  readStatus: boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, ref: 'Project' },
  senderId: { type: String, required: true, ref: 'User' },
  receiverId: { type: String, ref: 'User' },
  messageText: { type: String, required: true },
  readStatus: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

messageSchema.index({ projectId: 1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);

// AI Chat Message Model
export interface IAiChatMessage extends Document {
  _id: string;
  projectId: string;
  userId: string;
  role: string;
  content: string;
  agentType: string | null;
  metadata: any;
  createdAt: Date;
}

const aiChatMessageSchema = new Schema<IAiChatMessage>({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, ref: 'Project' },
  userId: { type: String, required: true, ref: 'User' },
  role: { type: String, required: true },
  content: { type: String, required: true },
  agentType: { type: String },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

aiChatMessageSchema.index({ projectId: 1 });

export const AiChatMessage = mongoose.model<IAiChatMessage>('AiChatMessage', aiChatMessageSchema);

// Transaction Model
export interface ITransaction extends Document {
  _id: string;
  userId: string;
  type: string;
  amount: string;
  description: string | null;
  balanceAfter: string | null;
  projectId: string | null;
  cryptoPaymentId: string | null;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  _id: { type: String, required: true },
  userId: { type: String, required: true, ref: 'User' },
  type: { type: String, required: true },
  amount: { type: String, required: true },
  description: { type: String },
  balanceAfter: { type: String },
  projectId: { type: String, ref: 'Project' },
  cryptoPaymentId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

transactionSchema.index({ userId: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);

// Agent Log Model
export interface IAgentLog extends Document {
  _id: string;
  projectId: string;
  agentType: string;
  action: string;
  result: string | null;
  cost: string;
  status: string | null;
  createdAt: Date;
}

const agentLogSchema = new Schema<IAgentLog>({
  _id: { type: String, required: true },
  projectId: { type: String, required: true, ref: 'Project' },
  agentType: { type: String, required: true },
  action: { type: String, required: true },
  result: { type: String },
  cost: { type: String, default: "0.00" },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

agentLogSchema.index({ projectId: 1 });

export const AgentLog = mongoose.model<IAgentLog>('AgentLog', agentLogSchema);

// Crypto Payment Model
export interface ICryptoPayment extends Document {
  _id: string;
  userId: string;
  addressIn: string | null;
  addressOut: string;
  coin: string;
  amountRequested: string;
  amountReceived: string;
  txidIn: string | null;
  confirmations: number;
  status: string | null;
  callbackUrl: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  confirmedAt: Date | null;
}

const cryptoPaymentSchema = new Schema<ICryptoPayment>({
  _id: { type: String, required: true },
  userId: { type: String, required: true, ref: 'User' },
  addressIn: { type: String },
  addressOut: { type: String, default: "TCZwoWnmi8uBssqjtKGmUwAjToAxcJkjLP" },
  coin: { type: String, default: "trc20/usdt" },
  amountRequested: { type: String, required: true },
  amountReceived: { type: String, default: "0" },
  txidIn: { type: String },
  confirmations: { type: Number, default: 0 },
  status: { type: String, default: "pending" },
  callbackUrl: { type: String },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
}, { _id: false });

cryptoPaymentSchema.index({ userId: 1 });
cryptoPaymentSchema.index({ addressIn: 1 });
cryptoPaymentSchema.index({ status: 1 });

export const CryptoPayment = mongoose.model<ICryptoPayment>('CryptoPayment', cryptoPaymentSchema);

// Pricing Model
export interface IPricing extends Document {
  _id: string;
  agentType: string;
  unit: string;
  rate: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
}

const pricingSchema = new Schema<IPricing>({
  _id: { type: String, required: true },
  agentType: { type: String, required: true },
  unit: { type: String, required: true },
  rate: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

pricingSchema.index({ agentType: 1, unit: 1 });

export const Pricing = mongoose.model<IPricing>('Pricing', pricingSchema);

// Template Model
export interface IStarterFile {
  filename: string;
  content: string;
}

export interface ITemplate extends Document {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string | null;
  language: string;
  framework: string | null;
  starterFiles: IStarterFile[];
  isActive: boolean;
  featured: boolean;
  createdAt: Date;
}

const starterFileSchema = new Schema<IStarterFile>({
  filename: { type: String, required: true },
  content: { type: String, required: true },
}, { _id: false });

const templateSchema = new Schema<ITemplate>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  icon: { type: String },
  language: { type: String, required: true },
  framework: { type: String },
  starterFiles: { type: [starterFileSchema], default: [] },
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

templateSchema.index({ category: 1 });
templateSchema.index({ isActive: 1 });
templateSchema.index({ featured: 1 });

export const Template = mongoose.model<ITemplate>('Template', templateSchema);
