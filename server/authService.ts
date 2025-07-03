import { supabase } from './db';
import { storage } from './storage';
import type { User, InsertUser } from '@shared/schema';

/**
 * Enhanced Supabase Auth Service with Custom User Management
 * Handles the complete flow: Supabase Auth + Custom Users Table
 */
export class AuthService {
  
  /**
   * 1. Create user in Supabase Auth + Custom Users Table
   * Called during sign-up process
   */
  async createUserComplete(userData: {
    email: string;
    password: string;
    name: string;
    companyId?: number;
    companyData?: any;
    role?: string;
  }): Promise<{ supabaseUser: any; customUser: User }> {
    try {
      // Import the same Supabase client used in routes
      const { supabase: routeSupabase } = await import('./db');
      
      let finalCompanyId = userData.companyId;

      // Step 1: Create company if companyData is provided
      if (userData.companyData && !userData.companyId) {
        console.log('Creating company atomically in AuthService:', userData.companyData);
        
        const { data: createdCompany, error: companyError } = await routeSupabase
          .from('companies')
          .insert([{
            name: userData.companyData.name,
            email: userData.companyData.email,
            cnpj: userData.companyData.CNPJ || null,
            phone: userData.companyData.phone || null,
            address: userData.companyData.address || null
          }])
          .select()
          .single();

        if (companyError) {
          throw new Error(`Erro ao criar empresa: ${companyError.message}`);
        }

        finalCompanyId = createdCompany.id;
        console.log('Company created atomically with ID:', finalCompanyId);
      }

      // Step 2: Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
          }
        }
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário no Supabase Auth: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Usuário não foi criado no Supabase Auth');
      }

      // Step 3: Create corresponding record in custom users table
      const customUserData = {
        email: userData.email,
        name: userData.name,
        supabase_user_id: authData.user.id,
        company_id: finalCompanyId || null,
        role: userData.role || 'operador',
      };

      // Use the same Supabase client to ensure consistency
      const { data: customUser, error: customUserError } = await routeSupabase
        .from('users')
        .insert([customUserData])
        .select()
        .single();

      if (customUserError) {
        throw new Error(`Erro ao criar usuário customizado: ${customUserError.message}`);
      }

      return {
        supabaseUser: authData.user,
        customUser
      };

    } catch (error) {
      console.error('Erro no createUserComplete:', error);
      throw error;
    }
  }

  /**
   * 2. Sync authenticated user to custom users table
   * Called when user logs in and we need to ensure they exist in custom table
   */
  async syncUserFromAuth(supabaseUserId: string): Promise<User> {
    try {
      // Check if user already exists in custom table
      const existingUser = await storage.getUserBySupabaseId(supabaseUserId);
      
      if (existingUser) {
        console.log('Existing user found:', !!existingUser);
        return existingUser;
      }

      // Get user data from Supabase Auth
      const { data: authUser, error } = await supabase.auth.admin.getUserById(supabaseUserId);
      
      if (error || !authUser.user) {
        throw new Error(`Usuário não encontrado no Supabase Auth: ${error?.message}`);
      }

      // Create user in custom table based on auth data
      // Special handling for MASTER user
      const isMasterUser = authUser.user.email === 'gerencia@loggme.com.br';
      
      const userData: InsertUser = {
        email: authUser.user.email || '',
        name: authUser.user.user_metadata?.name || 
              (isMasterUser ? 'Admin Master' : authUser.user.email?.split('@')[0] || 'Usuário'),
        supabaseUserId: authUser.user.id,
        companyId: isMasterUser ? null : 2, // MASTER = null, others = company 2 for demo
        role: isMasterUser ? 'MASTER' : 'operador',
        isActive: true,
      };

      const newUser = await storage.createUser(userData);
      console.log('New user created from auth sync:', newUser.email);
      
      return newUser;

    } catch (error) {
      console.error('Erro no syncUserFromAuth:', error);
      throw error;
    }
  }

  /**
   * 3. Update user profile (both Supabase Auth metadata and custom table)
   */
  async updateUserProfile(supabaseUserId: string, updates: {
    name?: string;
    email?: string;
    companyId?: number;
    role?: string;
  }): Promise<User> {
    try {
      // Update Supabase Auth metadata if name is being updated
      if (updates.name) {
        const { error: authError } = await supabase.auth.admin.updateUserById(supabaseUserId, {
          user_metadata: { name: updates.name }
        });

        if (authError) {
          console.warn('Erro ao atualizar metadata do Supabase:', authError.message);
        }
      }

      // Update custom users table
      const existingUser = await storage.getUserBySupabaseId(supabaseUserId);
      if (!existingUser) {
        throw new Error('Usuário não encontrado na tabela customizada');
      }

      const updateData = {
        ...updates,
        role: updates.role as 'MASTER' | 'admin' | 'gerente' | 'operador' | undefined
      };
      const updatedUser = await storage.updateUser(existingUser.id, updateData, existingUser.companyId);
      if (!updatedUser) {
        throw new Error('Erro ao atualizar usuário na tabela customizada');
      }

      return updatedUser;

    } catch (error) {
      console.error('Erro no updateUserProfile:', error);
      throw error;
    }
  }

  /**
   * 4. Get user by Supabase User ID (primary lookup method)
   */
  async getUserBySupabaseId(supabaseUserId: string): Promise<User | null> {
    try {
      const user = await storage.getUserBySupabaseId(supabaseUserId);
      return user || null;
    } catch (error) {
      console.error('Erro no getUserBySupabaseId:', error);
      return null;
    }
  }

  /**
   * 5. Verify if user is authenticated and return custom user data
   */
  async verifyAndGetUser(authToken: string): Promise<User | null> {
    try {
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(authToken);
      
      if (error || !user) {
        return null;
      }

      // Get custom user data
      return await this.getUserBySupabaseId(user.id);
      
    } catch (error) {
      console.error('Erro no verifyAndGetUser:', error);
      return null;
    }
  }

  /**
   * 6. Delete user (both from Supabase Auth and custom table)
   */
  async deleteUserComplete(supabaseUserId: string): Promise<boolean> {
    try {
      // Get custom user first
      const customUser = await storage.getUserBySupabaseId(supabaseUserId);
      
      // Delete from custom table
      if (customUser) {
        await storage.deleteUser(customUser.id, customUser.companyId || 0);
      }

      // Delete from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(supabaseUserId);
      
      if (authError) {
        console.warn('Erro ao deletar do Supabase Auth:', authError.message);
      }

      return true;

    } catch (error) {
      console.error('Erro no deleteUserComplete:', error);
      return false;
    }
  }

  /**
   * 7. Assign user to company (MASTER/admin function)
   */
  async assignUserToCompany(supabaseUserId: string, companyId: number, role: string = 'operador'): Promise<User> {
    try {
      const existingUser = await storage.getUserBySupabaseId(supabaseUserId);
      if (!existingUser) {
        throw new Error('Usuário não encontrado');
      }

      const updatedUser = await storage.updateUser(existingUser.id, { 
        companyId, 
        role: role as any 
      }, companyId);

      if (!updatedUser) {
        throw new Error('Erro ao atribuir usuário à empresa');
      }

      return updatedUser;

    } catch (error) {
      console.error('Erro no assignUserToCompany:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();