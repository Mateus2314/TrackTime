import { Router, Response } from 'express';
import { z } from 'zod';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
} from '../utils/validators';
import {
  loginUser,
  registerUser,
  refreshAccessToken,
  getCurrentUser,
} from '../services/auth.service';
import {
  authenticateToken,
  AuthRequest,
} from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user and create their company
 */
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const input = registerSchema.parse(req.body);
    const response = await registerUser(input);

    res.status(201).json({
      success: true,
      data: response,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return access token
 */
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const input = loginSchema.parse(req.body);
    const response = await loginUser(input);

    res.status(200).json({
      success: true,
      data: response,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const input = refreshTokenSchema.parse(req.body);
    const response = await refreshAccessToken(input.refreshToken);

    res.status(200).json({
      success: true,
      data: response,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token deletion)
 */
router.post('/logout', authenticateToken, async (_req: AuthRequest, res: Response) => {
  // Token invalidation is handled client-side
  // This endpoint can log logout events or clear server-side sessions if needed

  res.status(200).json({
    success: true,
    data: {
      message: 'Logout realizado com sucesso',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/auth/me
 * Get current authenticated user data
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.token) {
      throw new Error('Token não fornecido');
    }

    const userData = await getCurrentUser(req.token);

    res.status(200).json({
      success: true,
      data: userData,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

/**
 * Helper function to handle authentication errors
 */
function handleAuthError(error: unknown, res: Response) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Erro de validação',
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        })),
        statusCode: 400,
      },
    });
  }

  if (error instanceof Error) {
    // Check for specific error messages
    const statusCode = getStatusCodeFromError(error.message);

    return res.status(statusCode).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: error.message,
        statusCode,
      },
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
      statusCode: 500,
    },
  });
}

/**
 * Determine HTTP status code based on error message
 */
function getStatusCodeFromError(message: string): number {
  const messageLower = message.toLowerCase();

  if (messageLower.includes('not found')) return 404;
  if (messageLower.includes('already exists')) return 409;
  if (messageLower.includes('invalid') || messageLower.includes('inválido'))
    return 400;
  if (messageLower.includes('unauthorized') || messageLower.includes('access denied'))
    return 401;
  if (messageLower.includes('permission')) return 403;

  return 400;
}

export default router;
