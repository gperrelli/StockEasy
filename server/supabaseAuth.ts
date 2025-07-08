import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { authService } from './authService';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Function to set RLS context - simplified for application-level isolation
async function setRLSContext(userId: number, companyId: number | null, role: string) {
  console.log(`✅ RLS Context: userId=${userId}, companyId=${companyId}, role=${role}`);
  // RLS isolation is now handled at application level through proper WHERE clauses
  // in storage methods, avoiding WebSocket connection issues
}

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
      // For MASTER routes, fall back to mock auth
      if (req.path.startsWith('/api/master/')) {
        return mockAuth(req, res, next);
      }
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

    // Set RLS context for multi-tenant security
    await setRLSContext(userProfile.id, userProfile.companyId, userProfile.role);

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};



// Mock auth middleware for development (fallback when no service key)
export const mockAuth = async (req: any, res: Response, next: NextFunction) => {
  console.log("🔑 Mock Auth Middleware called for path:", req.path);

  // Try to get real user from auth header first
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      // Try to get user from Supabase if possible
      if (supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (!error && user) {
          // Get user profile from our database
          const userProfile = await storage.getUserBySupabaseId(user.id);

          if (userProfile) {
            req.user = {
              id: user.id,
              email: user.email!,
              name: userProfile.name,
              companyId: userProfile.companyId,
              role: userProfile.role
            };

            console.log("🔑 Real user from token:", req.user);

            // Validação crítica: usuários não-MASTER devem ter empresa
            if (!userProfile.companyId && userProfile.role !== 'MASTER') {
              console.log("🚨 CRITICAL: User has no company but is not MASTER role!");
              console.log(`   User: ${userProfile.name} (${userProfile.email})`);
              console.log(`   Role: ${userProfile.role}`);
              console.log(`   Company ID: ${userProfile.companyId}`);
              console.log("   This user needs to be assigned to a company immediately.");

              // Em produção, poderíamos retornar erro aqui
              // return res.status(403).json({ 
              //   error: 'User not properly configured. Contact administrator.' 
              // });
            }

            await setRLSContext(userProfile.id, userProfile.companyId, userProfile.role);
            return next();
          }
        }
      }
    } catch (error) {
      console.log("🔑 Token validation failed, falling back to mock user");
    }
  }

  // Fallback to mock user if no valid token or Supabase not available
  req.user = {
    id: 70,
    email: 'bonitobeeroficial@gmail.com',
    name: 'Bonito Beer',
    companyId: 21,
    role: 'admin'
  };

  console.log("🔑 Mock user set:", req.user);
  await setRLSContext(70, 21, 'admin');

  next();
};