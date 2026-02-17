import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '@tracktime/database';

/**
 * Extend Express Request with authenticated user data
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    auth_id: string;
    companies: Array<{
      company_id: string;
      role: string;
    }>;
  };
  token?: string;
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user data
 */
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token de autenticação não fornecido',
        statusCode: 401,
      },
    });
    return;
  }

  try {
    const supabase = getSupabaseClient();

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token inválido ou expirado',
          statusCode: 401,
        },
      });
      return;
    }

    // Get user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        id,
        email,
        auth_id,
        employees (
          company_id,
          role
        )
      `
      )
      .eq('auth_id', user.id)
      .single();

    if (userError || !userData) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuário não encontrado',
          statusCode: 401,
        },
      });
      return;
    }

    // Transform data to attach to request
    req.user = {
      id: userData.id,
      email: userData.email,
      auth_id: userData.auth_id,
      companies: (userData.employees || []).map((emp: any) => ({
        company_id: emp.company_id,
        role: emp.role,
      })),
    };

    req.token = token;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Erro ao autenticar usuário',
        statusCode: 500,
      },
    });
    return;
  }
}

/**
 * Optional authentication middleware
 * Does not fail if token is missing, but verifies if provided
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const supabase = getSupabaseClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      const { data: userData } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          auth_id,
          employees (
            company_id,
            role
          )
        `
        )
        .eq('auth_id', user.id)
        .single();

      if (userData) {
        req.user = {
          id: userData.id,
          email: userData.email,
          auth_id: userData.auth_id,
          companies: (userData.employees || []).map((emp: any) => ({
            company_id: emp.company_id,
            role: emp.role,
          })),
        };
        req.token = token;
      }
    }
  } catch (error) {
    // Silently fail - optional auth
    console.warn('Optional auth warning:', error);
  }

  next();
}

/**
 * Role-based access control middleware
 * Requires user to have specific role in their company
 */
export function requireRole(...allowedRoles: string[]) {
  return (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Autenticação obrigatória',
          statusCode: 401,
        },
      });
      return;
    }

    const hasRole = req.user.companies.some((c) =>
      allowedRoles.includes(c.role)
    );

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Permissão insuficiente para acessar este recurso',
          statusCode: 403,
          details: {
            requiredRoles: allowedRoles,
            userRoles: req.user.companies.map((c) => c.role),
          },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Company context middleware
 * Validates that user has access to requested company
 */
export function requireCompanyAccess(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Autenticação obrigatória',
        statusCode: 401,
      },
    });
    return;
  }

  const companyId = req.params.companyId || req.query.companyId;

  if (!companyId) {
    // Company ID is optional - middleware allows it
    next();
    return;
  }

  const hasAccess = req.user.companies.some(
    (c) => c.company_id === companyId
  );

  if (!hasAccess) {
    res.status(403).json({
      success: false,
      error: {
        code: 'COMPANY_ACCESS_DENIED',
        message: 'Você não tem acesso a esta empresa',
        statusCode: 403,
      },
    });
    return;
  }

  next();
}
