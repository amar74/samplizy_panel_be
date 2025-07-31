import 'express';

// Extend Express Request type for vendor authentication

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      vendorId: number;
      email: string;
      [key: string]: any;
    };
  }
} 