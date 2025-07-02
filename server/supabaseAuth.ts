import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Extended request type with user info
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    companyId: number;
    role: string;
  };
}

export const requireAuth = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase service not configured' });
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user profile from our database
    const userProfile = await storage.getUserBySupabaseId(user.id);
    
    if (!userProfile) {
      return res.status(401).json({ error: 'User profile not found' });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email!,
      name: userProfile.name,
      companyId: userProfile.companyId,
      role: userProfile.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Mock auth middleware for development (fallback when no service key)
export const mockAuth = (req: any, res: Response, next: NextFunction) => {
  req.user = {
    id: 'demo-user-1',
    email: 'admin@sistema.com',
    name: 'Admin Sistema',
    companyId: 2,
    role: 'admin'
  };
  next();
};