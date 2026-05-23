import pool from '../../config/db';

export interface CreateIssueInput {
  title: string;
  description: string;
  type: 'bug' | 'feature_request';
  reporter_id: number;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  type?: 'bug' | 'feature_request';
  status?: 'open' | 'in_progress' | 'resolved';
}

export interface IssueRow {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  reporter_id: number;
  created_at: string;
  updated_at: string;
}

export interface ReporterRow {
  id: number;
  name: string;
  role: string;
}

// Helper: fetch reporter details by IDs (no JOIN, separate query)
const fetchReporters = async (reporterIds: number[]): Promise<Map<number, ReporterRow>> => {
  if (reporterIds.length === 0) return new Map();

  const result = await pool.query<ReporterRow>(
    'SELECT id, name, role FROM users WHERE id = ANY($1)',
    [reporterIds]
  );

  const map = new Map<number, ReporterRow>();
  result.rows.forEach((r) => map.set(r.id, r));
  return map;
};

export const createIssue = async (input: CreateIssueInput) => {
  const { title, description, type, reporter_id } = input;

  // Validate reporter exists
  const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [reporter_id]);
  if (userCheck.rows.length === 0) {
    throw { statusCode: 404, message: 'Reporter not found.' };
  }

  const result = await pool.query<IssueRow>(
    `INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, type, reporter_id]
  );

  return result.rows[0];
};

export const getAllIssues = async (filters: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  const { sort = 'newest', type, status } = filters;

  // Build dynamic WHERE clause safely
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (type) {
    conditions.push(`type = $${idx++}`);
    values.push(type);
  }

  if (status) {
    conditions.push(`status = $${idx++}`);
    values.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause = sort === 'oldest' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

  const result = await pool.query<IssueRow>(
    `SELECT * FROM issues ${whereClause} ${orderClause}`,
    values
  );

  const issues = result.rows;

  // Fetch reporters separately (no JOIN)
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const reporterMap = await fetchReporters(reporterIds);

  return issues.map((issue) => {
    const { reporter_id, ...issueWithoutReporterId } = issue;
    return {
      ...issueWithoutReporterId,
      reporter: reporterMap.get(reporter_id) ?? null,
    };
  });
};

export const getIssueById = async (id: number) => {
  const result = await pool.query<IssueRow>('SELECT * FROM issues WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Issue not found.' };
  }

  const issue = result.rows[0];

  // Fetch reporter separately
  const reporterResult = await pool.query<ReporterRow>(
    'SELECT id, name, role FROM users WHERE id = $1',
    [issue.reporter_id]
  );

  const reporter = reporterResult.rows[0] ?? null;

  const { reporter_id, ...issueWithoutReporterId } = issue;

  return { ...issueWithoutReporterId, reporter };
};

export const updateIssue = async (
  id: number,
  input: UpdateIssueInput,
  requesterId: number,
  requesterRole: string
) => {
  // Fetch the issue first
  const result = await pool.query<IssueRow>('SELECT * FROM issues WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Issue not found.' };
  }

  const issue = result.rows[0];

  // Permission check
  if (requesterRole === 'contributor') {
    if (issue.reporter_id !== requesterId) {
      throw { statusCode: 403, message: 'You can only update your own issues.' };
    }
    if (issue.status !== 'open') {
      throw { statusCode: 409, message: 'Contributors can only update issues with open status.' };
    }
    // Contributors cannot change status
    delete input.status;
  }

  // Build SET clause dynamically
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.title !== undefined) { fields.push(`title = $${idx++}`); values.push(input.title); }
  if (input.description !== undefined) { fields.push(`description = $${idx++}`); values.push(input.description); }
  if (input.type !== undefined) { fields.push(`type = $${idx++}`); values.push(input.type); }
  if (input.status !== undefined) { fields.push(`status = $${idx++}`); values.push(input.status); }

  if (fields.length === 0) {
    throw { statusCode: 400, message: 'No fields provided to update.' };
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const updated = await pool.query<IssueRow>(
    `UPDATE issues SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return updated.rows[0];
};

export const deleteIssue = async (id: number) => {
  const result = await pool.query('SELECT id FROM issues WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw { statusCode: 404, message: 'Issue not found.' };
  }

  await pool.query('DELETE FROM issues WHERE id = $1', [id]);
};
