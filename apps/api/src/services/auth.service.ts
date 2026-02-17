import { getSupabaseClient } from '@tracktime/database';
import type { LoginInput, RegisterInput } from '../utils/validators';

/**
 * Authentication service for user registration and login
 */

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  companies: Array<{
    company_id: string;
    company_name: string;
    role: string;
  }>;
}

export interface UserData {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
}

/**
 * Register a new user and create their company
 */
export async function registerUser(
  input: RegisterInput
): Promise<AuthResponse> {
  const supabase = getSupabaseClient();

  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone,
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(
        authError?.message || 'Falha ao criar usuário de autenticação'
      );
    }

    const authId = authData.user.id;
    const accessToken = authData.session?.access_token || '';

    // 2. Create user record in public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authId,
        email: input.email,
        full_name: input.fullName,
        phone: input.phone || null,
      })
      .select()
      .single();

    if (userError) {
      // Cleanup: delete auth user if we fail to create user record
      await supabase.auth.admin.deleteUser(authId);
      throw new Error(
        userError.message || 'Falha ao criar registro do usuário'
      );
    }

    // 3. Get or create company
    let companyId: string;
    let companyName: string;

    if (input.companySlug) {
      // Join existing company
      const { data: existingCompany, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('slug', input.companySlug)
        .single();

      if (companyError || !existingCompany) {
        throw new Error('Empresa não encontrada');
      }

      companyId = existingCompany.id;
      companyName = existingCompany.name;
    } else {
      // Create new company
      const slug = input.companyName
        ? input.companyName
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '')
        : `company-${Date.now()}`;

      const { data: newCompany, error: newCompanyError } = await supabase
        .from('companies')
        .insert({
          name: input.companyName || `Empresa de ${input.fullName}`,
          slug,
        })
        .select()
        .single();

      if (newCompanyError || !newCompany) {
        throw new Error(
          newCompanyError?.message || 'Falha ao criar empresa'
        );
      }

      companyId = newCompany.id;
      companyName = newCompany.name;
    }

    // 4. Create employee record linking user to company
    const { error: employeeError } = await supabase
      .from('employees')
      .insert({
        user_id: userData.id,
        company_id: companyId,
        role: 'owner', // First user of company is owner
        hire_date: new Date().toISOString().split('T')[0],
      });

    if (employeeError) {
      throw new Error(
        employeeError.message || 'Falha ao criar registro de funcionário'
      );
    }

    // 5. Prepare response
    const refreshToken = authData.session?.refresh_token || '';
    const expiresIn = authData.session?.expires_in || 3600;

    return {
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
      },
      accessToken,
      refreshToken,
      expiresIn,
      companies: [
        {
          company_id: companyId,
          company_name: companyName,
          role: 'owner',
        },
      ],
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Login user and return auth tokens
 */
export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const supabase = getSupabaseClient();

  try {
    // 1. Authenticate with Supabase
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

    if (authError || !authData.user) {
      throw new Error(
        authError?.message || 'Email ou senha inválidos'
      );
    }

    // 2. Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('auth_id', authData.user.id)
      .single();

    if (userError || !userData) {
      throw new Error('Usuário não encontrado');
    }

    // 3. Get user's companies and roles
    const { data: companiesData, error: companiesError } = await supabase
      .from('employees')
      .select('company_id, role, companies(id, name)')
      .eq('user_id', userData.id)
      .eq('is_active', true);

    if (companiesError) {
      throw new Error(
        companiesError.message || 'Falha ao carregar empresas do usuário'
      );
    }

    // Filter companies if specific company requested
    let filteredCompanies = companiesData || [];
    if (input.companySlug) {
      const { data: targetCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', input.companySlug)
        .single();

      if (targetCompany) {
        filteredCompanies = filteredCompanies.filter(
          (e) => e.company_id === targetCompany.id
        );
      }
    }

    if (filteredCompanies.length === 0) {
      throw new Error(
        'Usuário não tem acesso a nenhuma empresa'
      );
    }

    const accessToken = authData.session?.access_token || '';
    const refreshToken = authData.session?.refresh_token || '';
    const expiresIn = authData.session?.expires_in || 3600;

    return {
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
      },
      accessToken,
      refreshToken,
      expiresIn,
      companies: filteredCompanies.map((emp) => ({
        company_id: emp.company_id,
        company_name: (emp.companies as any)?.name || 'Unknown',
        role: emp.role,
      })),
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<AuthResponse> {
  const supabase = getSupabaseClient();

  try {
    const { data: authData, error: authError } =
      await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

    if (authError || !authData.session) {
      throw new Error('Falha ao renovar token');
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('auth_id', authData.session.user.id)
      .single();

    const { data: companiesData } = await supabase
      .from('employees')
      .select('company_id, role, companies(id, name)')
      .eq('user_id', userData?.id)
      .eq('is_active', true);

    return {
      user: {
        id: userData?.id || '',
        email: userData?.email || '',
        fullName: userData?.full_name || '',
      },
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token || refreshToken,
      expiresIn: authData.session.expires_in,
      companies: (companiesData || []).map((emp) => ({
        company_id: emp.company_id,
        company_name: (emp.companies as any)?.name || 'Unknown',
        role: emp.role,
      })),
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get current user data from token
 */
export async function getCurrentUser(
  accessToken: string
): Promise<UserData & { companies: Array<{ company_id: string; role: string }> }> {
  const supabase = getSupabaseClient();

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(
      accessToken
    );

    if (authError || !authData.user) {
      throw new Error('Token inválido');
    }

    const { data: userData } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        full_name,
        avatar,
        employees (
          company_id,
          role
        )
      `
      )
      .eq('auth_id', authData.user.id)
      .single();

    if (!userData) {
      throw new Error('Usuário não encontrado');
    }

    return {
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name,
      avatar: userData.avatar,
      companies: (userData.employees || []).map((emp: any) => ({
        company_id: emp.company_id,
        role: emp.role,
      })),
    };
  } catch (error) {
    throw error;
  }
}
