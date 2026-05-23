import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/db';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: 'contributor' | 'maintainer';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: 'contributor' | 'maintainer';
  created_at: string;
  updated_at: string;
}

export const registerUser = async (input: RegisterInput) => {
  const { name, email, password, role = 'contributor' } = input;

  // Check if email already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw { statusCode: 400, message: 'Email already registered.' };
  }

  // Validate role
  if (role && !['contributor', 'maintainer'].includes(role)) {
    throw { statusCode: 400, message: 'Role must be contributor or maintainer.' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query<UserRow>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role]
  );

  return result.rows[0];
};

export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const result = await pool.query<UserRow>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email or password.' };
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  const { password: _pw, ...userWithoutPassword } = user;



  /// returnt

  return { token, user: userWithoutPassword };
};
