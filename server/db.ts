import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI must be set. Did you forget to configure the database?"
  );
}

let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: 'obentchi',
    });
    
    isConnected = true;
    console.log('MongoDB connected successfully');
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    return mongoose;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

export function getConnection() {
  return mongoose.connection;
}

export { mongoose };
