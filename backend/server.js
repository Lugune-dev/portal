const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto'); // 🔒 Used for password hashing

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
 console.log(`➡️ Received request: ${req.method} ${req.originalUrl}`);
next();
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
 fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
destination: (req, file, cb) => {
 cb(null, uploadDir);
 },
filename: (req, file, cb) => {
 cb(null, Date.now() + '-' + file.originalname);
 }
});
const upload = multer({ storage });

const db = mysql.createConnection({
 host: process.env.DB_HOST, // Replaces 'localhost' with 'interchange.proxy.rlwy.net'
 user: process.env.DB_USER, // Replaces 'sheddy' with 'root'
 password: process.env.DB_PASSWORD, // Uses the strong Railway password
 database: process.env.DB_NAME, // Replaces 'tphpa' with 'railway'
 port: parseInt(process.env.DB_PORT, 10), // CRUCIAL: Uses port 54879 and converts it to a number
}).promise();

db.connect((err) => {
 if (err) {
 console.error('❌ DB connection error:', err);
} else {
console.log('✅ MySQL Connected');
}
});

// Ensure approvals table exists (simple migration)
const approvalsTableSql = `
CREATE TABLE IF NOT EXISTS approvals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  instance_id BIGINT DEFAULT NULL,
  form_type_code VARCHAR(255) DEFAULT NULL,
  field_name VARCHAR(255) NOT NULL,
  requestor_user_id BIGINT NULL,
  approver_email VARCHAR(255) NULL,
  token_hash CHAR(64) NOT NULL,
  token_expires_at DATETIME NOT NULL,
  status ENUM('pending','approved','rejected','expired','cancelled') NOT NULL DEFAULT 'pending',
  decision_comment TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approved_at DATETIME NULL,
  approver_ip VARCHAR(64) NULL,
  approver_user_agent TEXT NULL,
  signature_payload JSON NULL
);
`;

db.query(approvalsTableSql).then(() => {
  console.log('✅ approvals table ensured');
}).catch(err => {
  console.error('❌ Could not ensure approvals table:', err);
});

// Backfill / ALTER existing approvals table if it was created previously without some columns
(async () => {
  try {
    const ensureColumn = async (table, column, definition) => {
      const [cols] = await db.query(`SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`, [table, column]);
      if (!cols || cols.length === 0) {
        console.log(`ℹ️ Adding missing column ${column} to table ${table}`);
        await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      } else {
        // If column exists but is NOT NULL and our desired definition allows NULL, try to modify it
        const col = cols[0];
        if (definition.includes('DEFAULT NULL') && (col.IS_NULLABLE === 'NO' || col.COLUMN_DEFAULT !== null)) {
          try {
            console.log(`ℹ️ Modifying column ${column} on ${table} to allow NULL/default NULL`);
            await db.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${definition}`);
          } catch (modErr) {
            // ignore modification errors (permissions or incompatible types)
            console.warn(`⚠️ Could not modify column ${column}:`, modErr.message || modErr);
          }
        }
      }
    };

    await ensureColumn('approvals', 'instance_id', 'BIGINT DEFAULT NULL');
    await ensureColumn('approvals', 'form_type_code', "VARCHAR(255) DEFAULT NULL");
    await ensureColumn('approvals', 'approver_email', "VARCHAR(255) NULL");
    await ensureColumn('approvals', 'token_hash', "CHAR(64) NOT NULL");
    await ensureColumn('approvals', 'token_expires_at', "DATETIME NOT NULL");
    await ensureColumn('approvals', 'status', "ENUM('pending','approved','rejected','expired','cancelled') NOT NULL DEFAULT 'pending'");
    await ensureColumn('approvals', 'decision_comment', 'TEXT NULL');
    await ensureColumn('approvals', 'approved_at', 'DATETIME NULL');
    await ensureColumn('approvals', 'approver_ip', "VARCHAR(64) NULL");
    await ensureColumn('approvals', 'approver_user_agent', 'TEXT NULL');
    await ensureColumn('approvals', 'signature_payload', 'JSON NULL');
  await ensureColumn('approvals', 'notified_at', 'DATETIME NULL');

    // Legacy schema: some DBs may have a non-nullable 'form_id' column; ensure it's present and nullable
    const [formIdCols] = await db.query(`SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'approvals' AND COLUMN_NAME = 'form_id'`);
    if (formIdCols && formIdCols.length > 0) {
      const col = formIdCols[0];
      if (col.IS_NULLABLE === 'NO' && col.COLUMN_DEFAULT === null) {
        try {
          console.log('ℹ️ Modifying existing approvals.form_id to allow NULL and default NULL');
          await db.query(`ALTER TABLE approvals MODIFY COLUMN form_id ${col.COLUMN_TYPE} DEFAULT NULL`);
        } catch (merr) {
          console.warn('⚠️ Could not modify approvals.form_id:', merr.message || merr);
        }
      }
    } else {
      // Add missing form_id column as nullable for compatibility
      try {
        console.log('ℹ️ Adding missing column form_id to approvals');
        await db.query(`ALTER TABLE approvals ADD COLUMN form_id BIGINT DEFAULT NULL`);
      } catch (aerr) {
        console.warn('⚠️ Could not add approvals.form_id:', aerr.message || aerr);
      }
    }

    console.log('✅ approvals table columns checked/updated');
  } catch (e) {
    console.warn('⚠️ Could not alter approvals table (may already be correct or lack permissions):', e.message || e);
  }
})();

app.get('/api/health', (req, res) => {
res.json({ status: 'ok' });
});

// -----------------------
// Approvals endpoints
// -----------------------
const cryptoHash = (input) => crypto.createHash('sha256').update(input).digest('hex');

// Helper to send or log email. Uses SMTP if configured via env, otherwise logs to file
const sendApprovalEmail = async ({ to, subject, html, text }) => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html });
      console.log('📧 Approval email sent:', info.messageId);
      return { sent: true, info };
    } catch (err) {
      console.error('❌ Failed to send email via SMTP:', err);
      // fallthrough to log
    }
  }

  // Fallback: append to local log file for demo/testing
  const logLine = `${new Date().toISOString()} APPROVAL_EMAIL -> to=${to} subject=${subject} body=${text}\n`;
  fs.appendFile(path.join(__dirname, 'uploads', 'approval_emails.log'), logLine, () => {});
  console.log('ℹ️ Approval email logged to uploads/approval_emails.log');
  return { sent: false, logged: true };
};

// Create an approval request
app.post('/api/approvals', async (req, res) => {
  const { formId, fieldName, requestorId, note, approverEmail } = req.body;

  if (!fieldName) return res.status(400).json({ success: false, error: 'fieldName is required' });

  try {
    // Determine approver email if not provided: pick any user with role Director (UserRoleID=2)
    let targetEmail = approverEmail || process.env.DEFAULT_APPROVER_EMAIL || null;
    if (!targetEmail) {
      const [rows] = await db.query('SELECT Email FROM Users WHERE UserRoleID = 2 LIMIT 1');
      if (rows && rows.length > 0) targetEmail = rows[0].Email;
    }

    if (!targetEmail) {
      return res.status(400).json({ success: false, error: 'No approver email available; provide approverEmail or configure DEFAULT_APPROVER_EMAIL or add a Director user' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = cryptoHash(token);
    const expiresAt = new Date(Date.now() + ((process.env.APPROVAL_TOKEN_TTL_MINUTES ? parseInt(process.env.APPROVAL_TOKEN_TTL_MINUTES) : 24*60) * 60000));

  // Some legacy schemas include a non-nullable `form_id` column. Provide explicit NULL for compatibility.
  const insertSql = `INSERT INTO approvals (form_id, instance_id, form_type_code, field_name, requestor_user_id, approver_email, token_hash, token_expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;
  // formId could be an instance id or a form type code; try to store number if numeric
  const instanceId = (typeof formId === 'number' || (typeof formId === 'string' && /^[0-9]+$/.test(formId))) ? formId : null;
  const formTypeCode = instanceId ? null : formId;

  const [result] = await db.query(insertSql, [null, instanceId, formTypeCode, fieldName, requestorId || null, targetEmail, tokenHash, expiresAt]);
    const approvalId = result.insertId;

    // build approval link
    const link = `${process.env.APP_BASE_URL || ('http://localhost:' + PORT)}/approvals/verify?token=${token}`;

    const subject = `Approval requested: ${fieldName}`;
    const text = `An approval has been requested for field ${fieldName} by user ${requestorId || 'unknown'}.\n\nOpen the link to review and approve: ${link}\n\nThis link expires at ${expiresAt.toISOString()}`;
    const html = `<p>An approval has been requested for field <b>${fieldName}</b> by user ${requestorId || 'unknown'}.</p><p><a href="${link}">Open approval page</a></p><p>Expires: ${expiresAt.toISOString()}</p>`;

    await sendApprovalEmail({ to: targetEmail, subject, text, html });

    return res.status(201).json({ success: true, id: approvalId, pending: true, created_at: new Date().toISOString(), mock: true });
  } catch (err) {
    console.error('❌ Error creating approval:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Verify token and return request details (used by the approval landing page)
app.get('/api/approvals/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ success: false, error: 'token is required' });
  try {
    const tokenHash = cryptoHash(String(token));
    const [rows] = await db.query('SELECT * FROM approvals WHERE token_hash = ? LIMIT 1', [tokenHash]);
    const row = rows && rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Invalid token' });

    if (row.status !== 'pending') return res.status(400).json({ success: false, error: 'Token already used or not pending' });
    if (new Date(row.token_expires_at) < new Date()) return res.status(400).json({ success: false, error: 'Token expired' });

    // Return minimal details for the approval page
    const requestDetails = {
      id: row.id,
      instance_id: row.instance_id,
      form_type_code: row.form_type_code,
      field_name: row.field_name,
      approver_email: row.approver_email,
      created_at: row.created_at
    };
    return res.json({ success: true, request: requestDetails });
  } catch (err) {
    console.error('❌ Error verifying approval token:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Return approval by id (status endpoint for polling)
app.get('/api/approvals/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, instance_id, form_type_code, field_name, approver_email, requestor_user_id, status, signature_payload, created_at, approved_at, notified_at FROM approvals WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, approval: rows[0] });
  } catch (err) {
    console.error('❌ Error fetching approval by id:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Confirm approval (approve or reject)
app.post('/api/approvals/confirm', async (req, res) => {
  const { token, decision, comment, approverName } = req.body;
  if (!token || !decision) return res.status(400).json({ success: false, error: 'token and decision are required' });
  try {
    const tokenHash = cryptoHash(String(token));
    const [rows] = await db.query('SELECT * FROM approvals WHERE token_hash = ? LIMIT 1', [tokenHash]);
    const row = rows && rows[0];
    if (!row) return res.status(404).json({ success: false, error: 'Invalid token' });
    if (row.status !== 'pending') return res.status(400).json({ success: false, error: 'Token already used or not pending' });
    if (new Date(row.token_expires_at) < new Date()) return res.status(400).json({ success: false, error: 'Token expired' });

    const approver_ip = req.ip || req.connection?.remoteAddress || null;
    const approver_user_agent = req.headers['user-agent'] || null;
    const approvedAt = new Date();

    // Update approval record
    const newStatus = decision === 'approved' ? 'approved' : 'rejected';
    await db.query('UPDATE approvals SET status = ?, decision_comment = ?, approved_at = ?, approver_ip = ?, approver_user_agent = ? WHERE id = ?', [newStatus, comment || null, approvedAt, approver_ip, approver_user_agent, row.id]);

    // Prepare signature payload if approved
    let signaturePayload = null;
    if (decision === 'approved') {
      signaturePayload = {
        signed_by: null,
        signed_by_name: approverName || row.approver_email,
        signature_type: 'external',
        signed_at: approvedAt.toISOString(),
        approver_comment: comment || null,
        approver_ip,
        approver_user_agent,
        approval_record_id: row.id
      };

      // Try to find the latest form submission to attach the signature
      try {
        let submission = null;
        if (row.instance_id) {
          const [subs] = await db.query('SELECT * FROM form_submissions WHERE instance_id = ? ORDER BY created_at DESC LIMIT 1', [row.instance_id]);
          submission = subs && subs[0];
        }
        if (!submission && row.form_type_code) {
          const [subs2] = await db.query('SELECT * FROM form_submissions WHERE form_type = ? ORDER BY created_at DESC LIMIT 1', [row.form_type_code]);
          submission = subs2 && subs2[0];
        }

        if (submission) {
          let formData = {};
          try { formData = submission.form_data ? JSON.parse(submission.form_data) : {}; } catch (e) { formData = {}; }
          // write signature JSON string into the field
          formData[row.field_name] = JSON.stringify(signaturePayload);

          const insertQuery = `
            INSERT INTO form_submissions (instance_id, action_type, action_by, comments, form_data, form_type)
            VALUES (?, 'external_approval', ?, ?, ?, ?)
          `;
          await db.query(insertQuery, [submission.instance_id || null, null, `External approval: ${row.approver_email}`, JSON.stringify(formData), submission.form_type || null]);
        } else {
          console.warn('No matching submission found to attach signature for approval id', row.id);
        }
      } catch (e) {
        console.error('❌ Error attaching signature to form submission:', e);
      }
    }

    // Save signature payload into approvals table for audit
    await db.query('UPDATE approvals SET signature_payload = ? WHERE id = ?', [signaturePayload ? JSON.stringify(signaturePayload) : null, row.id]);

    // Notify the original requestor (if present) that their request was decided
    try {
      let requestorEmail = null;
      if (row.requestor_user_id) {
        const [rrows] = await db.query('SELECT Email FROM Users WHERE UserID = ? LIMIT 1', [row.requestor_user_id]);
        if (rrows && rrows[0]) requestorEmail = rrows[0].Email;
      }
      if (requestorEmail) {
        const subject = `Approval ${newStatus}: ${row.field_name}`;
        const body = `Your approval request for field ${row.field_name} (form ${row.form_type_code || row.instance_id}) has been ${newStatus} by ${approverName || row.approver_email}.\n\nComment: ${comment || '-'}\n\nAt: ${approvedAt.toISOString()}`;
        await sendApprovalEmail({ to: requestorEmail, subject, text: body, html: `<p>${body.replace(/\n/g,'<br/>')}</p>` });
        await db.query('UPDATE approvals SET notified_at = ? WHERE id = ?', [new Date(), row.id]);
      }
    } catch (notifyErr) {
      console.warn('⚠️ Could not notify requestor:', notifyErr && notifyErr.message ? notifyErr.message : notifyErr);
    }

    return res.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('❌ Error confirming approval:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- LOGIN ROUTE (Updated with Hashing) ---
// ---------------------------------------------------
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const query = 'SELECT UserID, Email, FirstName, LastName, PasswordHash, UserRoleID, OrgUnitID FROM Users WHERE Email = ?';
        const [rows] = await db.query(query, [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 🔒 Hash the incoming password for comparison
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        if (user.PasswordHash === hashedPassword) {
            // Remove hash before sending user object to client
            delete user.PasswordHash;

            // 🔑 CRITICAL DEBUG LOG: Print the exact user object being sent
            console.log(`✅ Login successful for ${user.Email}. User object sent:`, user);

            return res.status(200).json({ message: 'Login successful', user: user });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------------------
// --- FORGOT PASSWORD ROUTE ---
// ---------------------------------------------------
console.log('Defining forgot-password route');
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Check if user exists
        const query = 'SELECT UserID, Email FROM Users WHERE Email = ?';
        const [rows] = await db.query(query, [email]);
        const user = rows[0];

        if (!user) {
            // For security reasons, don't reveal if email exists or not
            return res.status(200).json({ message: 'If the email exists, a password reset link has been sent.' });
        }

        // TODO: In a real application, you would:
        // 1. Generate a secure reset token
        // 2. Store it in the database with expiration
        // 3. Send an email with the reset link
        // For now, just return success message

        console.log(`Password reset requested for: ${email}`);
        return res.status(200).json({ message: 'If the email exists, a password reset link has been sent.' });

    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// ---------------------------------------------------
// --- ADVERTISEMENT UPLOAD (FIXED isActive) ---
// ---------------------------------------------------
app.post('/api/advertisements', upload.single('image'), async (req, res) => {
  // Destructure all the fields you need from the request body
  const { title, description, linkUrl, startDate, endDate, isActive } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  if (!imagePath) {
    return res.status(400).json({ message: 'Image file is required' });
  }

  // 🔑 CRITICAL FIX: Convert the incoming string '1'/'0' to the integer 1 or 0.
  const isActiveDbValue = isActive === '1' ? 1 : 0;

  const query = 'INSERT INTO advertisements (title, description, imageUrl, linkUrl, startDate, endDate, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)';

  try {
    const [result] = await db.query(query, [
      title,
      description,
      imagePath,
      linkUrl,
      startDate,
      endDate,
      isActiveDbValue // 👈 Now passing 1 or 0
    ]);
    res.status(201).json({ message: 'Advertisement uploaded successfully', id: result.insertId });
  } catch (err) {
    console.error('❌ DB Insert Error:', err);
    return res.status(500).json({ message: 'Failed to save advertisement' });
  }
});

// ---------------------------------------------------
// --- ADVERTISEMENT FETCH (FIXED IMAGE URL) ---
// ---------------------------------------------------
app.get('/api/advertisements', async (req, res) => {
    const query = 'SELECT * FROM advertisements';
    try {
        const [results] = await db.query(query);

        const adsWithUrls = results.map(ad => ({
            id: ad.id,
            title: ad.title,
            description: ad.description,
            // 💡 CRITICAL FIX: Return a RELATIVE URL so the Angular proxy handles it
            imageUrl: ad.imageUrl ? `/uploads/${ad.imageUrl}` : '',
            linkUrl: ad.linkUrl || '#',
            startDate: ad.startDate,
            endDate: ad.endDate,
            isActive: ad.isActive === 1
        }));

        console.log('Final data sent to client:', adsWithUrls);
        res.json({ success: true, data: adsWithUrls });
    } catch (err) {
        console.error('❌ Error fetching advertisements:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
    }
});

// --- IMPREST, RETIREMENT, CLAIMS, FORMS, DEBUG ROUTES (UNCHANGED) ---
app.post('/api/imprest', async (req, res) => { /* ... */ });
app.post('/api/retirement', upload.array('documents', 5), async (req, res) => { /* ... */ });
app.post('/api/claims', upload.array('receipts', 10), async (req, res) => { /* ... */ });
app.get('/api/debug/tables', async (req, res) => { /* ... */ });

app.post('/api/forms/submit/:formType', async (req, res) => {

  const { formType } = req.params;

  const { instance_id, action_type, action_by, comments, ...formData } = req.body;

  console.log(`➡️ Received submission for form type: ${formType}`);
  console.log(' - Action Type:', action_type);
  console.log(' - Instance ID:', instance_id);

  // Basic validation for required fields from the client
  if (!instance_id || !action_type || !action_by) {
    return res.status(400).json({ success: false, message: 'Missing required submission metadata (instance_id, action_type, action_by).' });
  }

  // Get form type name from form_types table
  let formTypeName = formType; // fallback to code
  let formTypeCode = formType;
  try {
    const formTypeQuery = 'SELECT form_type_name FROM form_types WHERE form_type_code = ?';
    const [formTypeRows] = await db.query(formTypeQuery, [formType]);
    if (formTypeRows.length > 0) {
      formTypeName = formTypeRows[0].form_type_name;
    }
  } catch (err) {
    console.warn('Could not fetch form type name:', err);
  }

  // Use JSON.stringify to ensure the data is stored correctly as a JSON string
  const formDataJson = JSON.stringify(formData);

  const query = `
    INSERT INTO form_submissions (instance_id, action_type, action_by, comments, form_data, form_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.execute(query, [
      instance_id,
      action_type,
      action_by,
      comments,
      formDataJson,
      formTypeCode
    ]);

    const submissionId = result.insertId;
    console.log(`✅ Submission saved successfully with ID: ${submissionId}`);

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      submissionId: submissionId
    });
  } catch (error) {
    console.error('❌ Form submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit form due to a server error.' });
  }
});

app.get('/api/forms/config/:formType', async (req, res) => {

  const { formType } = req.params;
  console.log('📋 Fetching form config for:', formType);

const query = `SELECT
ft.form_type_id,
ft.form_type_name,
ft.form_type_code,
fs.section_id,
fs.section_name,
fs.section_order,
fs.is_repeatable,
fs.max_repeats,
ff.field_id,
ff.field_name,
ff.field_label,
ff.field_type,
ff.field_order,
ff.is_required,
ff.default_value,
ff.placeholder_text,
ff.validation_rules,
ff.options,
ff.signature_type
FROM form_types ft
LEFT JOIN form_sections fs ON ft.form_type_id = fs.form_type_id
LEFT JOIN form_fields ff ON fs.section_id = ff.section_id
WHERE ft.form_type_code = ?
ORDER BY fs.section_order, ff.field_order`;

  try {
    const [results] = await db.query(query, [formType]);

    if (results.length === 0) {
      console.log('❌ Form type not found:', formType);
      return res.status(404).json({ error: `Form configuration not found for type: ${formType}` });
    }

    console.log('✅ Found', results.length, 'rows for form type:', formType);

    // Transform the flat result into nested structure
    const formConfig = {
      form_type_id: results[0].form_type_id,
      form_type_name: results[0].form_type_name,
      form_type_code: results[0].form_type_code,
      sections: []
    };

    const sectionsMap = new Map();

    // Helper function to robustly parse JSON fields
    const parseJsonField = (fieldValue, fieldName) => {
      if (!fieldValue) return null;
      if (typeof fieldValue === 'object') {
        return fieldValue; // Already parsed by mysql2
      }
      if (typeof fieldValue === 'string') {
        try {
          // Attempt JSON parsing only if it looks like JSON
          if (fieldValue.trim().startsWith('{') || fieldValue.trim().startsWith('[')) {
             return JSON.parse(fieldValue);
          }
          return fieldValue; // Return the string as-is
        } catch (parseError) {
          console.warn(`Failed to parse ${fieldName}:`, parseError.message, 'Value:', fieldValue.substring(0, 50) + '...');
          return fieldValue; // Return the original string on error
        }
      }
      return fieldValue;
    };


    results.forEach(row => {
      // Only process if we have section data
      if (row.section_id && !sectionsMap.has(row.section_id)) {
        sectionsMap.set(row.section_id, {
          section_id: row.section_id,
          section_name: row.section_name,
          section_order: row.section_order,
          is_repeatable: Boolean(row.is_repeatable),
          max_repeats: row.max_repeats,
          fields: []
        });
      }

      // Only add fields if we have field data
      if (row.field_id && row.section_id) {
        const section = sectionsMap.get(row.section_id);
        if (section) {
          // Convert tinyint(1) to boolean and handle JSON fields
          const field = {
            field_id: row.field_id,
            field_name: row.field_name,
            field_label: row.field_label,
            field_type: row.field_type,
            field_order: row.field_order,
            is_required: Boolean(row.is_required),
            default_value: row.default_value,
            placeholder_text: row.placeholder_text,
            validation_rules: parseJsonField(row.validation_rules, 'validation_rules'),
            options: parseJsonField(row.options, 'options')
          };

          section.fields.push(field);
        }
      }
    });

    formConfig.sections = Array.from(sectionsMap.values());
    console.log('✅ Form config loaded successfully. Sections:', formConfig.sections.length);

    // Log some debug info
    formConfig.sections.forEach(section => {
      console.log(` - ${section.section_name}: ${section.fields.length} fields`);
    });

    res.json(formConfig);
  } catch (err) {
    console.error('❌ Database error:', err);
    return res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// ---------------------------------------------------
// --- DEBUG: Check JSON fields in DB ---
// ---------------------------------------------------
app.get('/api/debug/json-fields', async (req, res) => {

  const query = `
    SELECT
      field_id,
      field_name,
      validation_rules,
      options,
      LENGTH(validation_rules) as validation_rules_length,
      LENGTH(options) as options_length
    FROM form_fields
    WHERE validation_rules IS NOT NULL OR options IS NOT NULL
  `;


  try {
    const [results] = await db.query(query);
    // Add a sample of the actual content
    const detailedResults = results.map(row => ({
      ...row,
      validation_rules_sample: row.validation_rules ? String(row.validation_rules).substring(0, 100) : null,
      options_sample: row.options ? String(row.options).substring(0, 100) : null
    }));
    res.json(detailedResults);
  } catch (err) {
    return res.status(500).json({ error: 'Debug query failed: ' + err.message });
  }

});

// --- REPORTS ROUTES (UPDATED FOR REAL DATABASE) ---
app.post('/api/reports/submit', upload.single('attachment'), async (req, res) => {
  const { title, description, type, userId } = req.body;
  const attachmentPath = req.file ? req.file.filename : null;

  try {
    // Get user details for submitter info
    const userQuery = 'SELECT FirstName, LastName, OrgUnitID FROM Users WHERE UserID = ?';
    const [userRows] = await db.query(userQuery, [userId]);
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const submitterName = `${user.FirstName} ${user.LastName}`;
    const submitterUnitId = user.OrgUnitID;

    // Insert into reports table
    const insertQuery = `
      INSERT INTO reports (title, submitter_name, submitter_unit_id, type, submitted_date, status, comments, attachment_path)
      VALUES (?, ?, ?, ?, NOW(), 'PENDING', '', ?)
    `;
    const [result] = await db.query(insertQuery, [title, submitterName, submitterUnitId, type, attachmentPath]);

    res.json({ success: true, message: 'Report submitted successfully', reportId: result.insertId });
  } catch (err) {
    console.error('Error submitting report:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/reports/manager-queue/:managerUnitId', async (req, res) => {
  const { managerUnitId } = req.params;
  try {
    // Get reports from the manager's unit and subordinate units that are pending and require manager review
    const query = `
      SELECT r.id, r.title, r.submitter_name, r.submitter_unit_id, r.type, r.submitted_date, r.status, r.comments
      FROM reports r
      LEFT JOIN ReportWorkflows rw ON r.type = rw.ReportType
      WHERE r.status = 'PENDING'
      AND r.submitter_unit_id IN (
        SELECT ou.OrgUnitID FROM OrganizationUnits ou
        WHERE ou.OrgUnitID = ? OR ou.ParentUnitID = ? OR ou.ParentUnitID IN (
          SELECT ou2.OrgUnitID FROM OrganizationUnits ou2 WHERE ou2.ParentUnitID = ?
        )
      )
      AND (rw.ReviewerRoleID = 3 OR rw.ReviewerRoleID IS NULL)
      ORDER BY r.submitted_date DESC
    `;
    const [reports] = await db.query(query, [managerUnitId, managerUnitId, managerUnitId]);
    res.json(reports);
  } catch (err) {
    console.error('Error fetching manager queue:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/reports/subordinate-workload/:managerUnitId', async (req, res) => {
  const { managerUnitId } = req.params;
  try {
    // Get workload summary for subordinate units
    const query = `
      SELECT ou.UnitName as name, COUNT(r.id) as totalReports,
             SUM(CASE WHEN r.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
             SUM(CASE WHEN r.status = 'APPROVED' THEN 1 ELSE 0 END) as approved
      FROM OrganizationUnits ou
      LEFT JOIN reports r ON ou.OrgUnitID = r.submitter_unit_id
      WHERE ou.ParentUnitID = ?
      GROUP BY ou.OrgUnitID, ou.UnitName
      ORDER BY ou.UnitName
    `;
    const [workload] = await db.query(query, [managerUnitId]);
    res.json(workload);
  } catch (err) {
    console.error('Error fetching subordinate workload:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reports/approve', async (req, res) => {
  const { reportId, comment } = req.body;
  try {
    const query = `UPDATE reports SET status = 'SENT_TO_DIRECTOR', comments = ? WHERE id = ?`;
    const [result] = await db.query(query, [comment, reportId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Report sent to director for final approval' });
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (err) {
    console.error('Error approving report:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/reports/reject', async (req, res) => {
  const { reportId, comment } = req.body;
  try {
    const query = `UPDATE reports SET status = 'REJECTED', comments = ? WHERE id = ?`;
    const [result] = await db.query(query, [comment, reportId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Report rejected' });
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (err) {
    console.error('Error rejecting report:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/reports/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Get user details to match submitter_name
    const userQuery = 'SELECT FirstName, LastName FROM Users WHERE UserID = ?';
    const [userRows] = await db.query(userQuery, [userId]);
    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const submitterName = `${user.FirstName} ${user.LastName}`;

    // Get reports submitted by this user
    const query = `
      SELECT id, title, submitter_name, submitter_unit_id, type, submitted_date, status, comments
      FROM reports
      WHERE submitter_name = ?
      ORDER BY submitted_date DESC
    `;
    const [reports] = await db.query(query, [submitterName]);
    res.json(reports);
  } catch (err) {
    console.error('Error fetching user reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- HIERARCHY ROUTES (UNCHANGED) ---
app.get('/api/hierarchy/subordinates/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Query subordinates based on reporting structure (assume users table has reporting_to column)
    const query = `
      SELECT id, name, email, role FROM users
      WHERE reporting_to = ? AND role = 'employee'
    `;
    const [subordinates] = await db.query(query, [userId]);
    res.json({ success: true, data: subordinates });
  } catch (err) {
    console.error('Error fetching subordinates:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/hierarchy/reports/:role', async (req, res) => {
  const { role } = req.params;
  try {
    // Aggregate reports by role (e.g., pending forms count)
    const query = `
      SELECT role, COUNT(*) as count FROM form_submissions
      WHERE action_type = 'pending' GROUP BY role HAVING role = ?
    `;
    const [reports] = await db.query(query, [role]);
    res.json({ success: true, data: reports });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/forms/subordinate-forms/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Get the manager's OrgUnitID
    const managerQuery = 'SELECT OrgUnitID FROM Users WHERE UserID = ?';
    const [managerRows] = await db.query(managerQuery, [userId]);
    if (managerRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }
    const managerUnitId = managerRows[0].OrgUnitID;

    // Get forms submitted by users in the manager's unit, direct subordinate units, or units under direct subordinates
    const query = `
      SELECT fs.submission_id AS id, fs.instance_id, fs.action_type, fs.action_by, fs.comments, fs.form_data, fs.created_at,
             u.FirstName, u.LastName, u.Email, ou.UnitName, COALESCE(ft.form_type_name, fs.form_type, 'Unknown') AS form_type_name, ft.form_type_code AS form_type_code
      FROM form_submissions fs
      JOIN Users u ON fs.action_by = u.UserID
      JOIN OrganizationUnits ou ON u.OrgUnitID = ou.OrgUnitID
      LEFT JOIN form_types ft ON fs.form_type = ft.form_type_code
      WHERE (ou.OrgUnitID = ? OR ou.ParentUnitID = ? OR ou.ParentUnitID IN (SELECT OrgUnitID FROM OrganizationUnits WHERE ParentUnitID = ?)) AND fs.action_type = 'submit'
      ORDER BY fs.created_at DESC
    `;
    const [forms] = await db.query(query, [managerUnitId, managerUnitId, managerUnitId]);
    res.json({ success: true, data: forms });
  } catch (err) {
    console.error('Error fetching subordinate forms:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/forms/approve/:formId', async (req, res) => {
  const { formId } = req.params;
  const { approverId, comments } = req.body;
  console.log('Approving form:', { formId, approverId, comments });
  try {
    const query = `
      INSERT INTO form_submissions (instance_id, action_type, action_by, comments, form_data, form_type)
      SELECT instance_id, 'approve', ?, ?, form_data, form_type
      FROM form_submissions
      WHERE submission_id = ?
    `;
    console.log('Executing query:', query, 'with params:', [approverId, comments, formId]);
    const [result] = await db.query(query, [approverId, comments, formId]);
    console.log('Approve result:', result);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Form approved' });
    } else {
      res.status(404).json({ success: false, message: 'Form not found' });
    }
  } catch (err) {
    console.error('Error approving form:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

app.post('/api/forms/reject/:formId', async (req, res) => {
  const { formId } = req.params;
  const { rejectorId, comments } = req.body;
  try {
    const query = `
      UPDATE form_submissions SET action_type = 'reject', action_by = ?, comments = ?
      WHERE submission_id = ?
    `;
    const [result] = await db.query(query, [rejectorId, comments, formId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Form rejected' });
    } else {
      res.status(404).json({ success: false, message: 'Form not found' });
    }
  } catch (err) {
    console.error('Error rejecting form:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/forms/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // Get the latest submission for each form instance submitted by the user
    const query = `
      SELECT fs.submission_id AS id, fs.instance_id, fs.action_type, fs.action_by, fs.comments, fs.form_data, fs.created_at,
             COALESCE(ft.form_type_name, fs.form_type, 'Unknown') AS form_type_name, ft.form_type_code
      FROM form_submissions fs
      LEFT JOIN form_types ft ON fs.form_type = ft.form_type_code
      INNER JOIN (
        SELECT instance_id, MAX(created_at) as latest_created_at
        FROM form_submissions
        WHERE instance_id IN (
          SELECT instance_id FROM form_submissions WHERE action_type = 'submit' AND action_by = ?
        )
        GROUP BY instance_id
      ) latest ON fs.instance_id = latest.instance_id AND fs.created_at = latest.latest_created_at
      ORDER BY fs.created_at DESC
    `;
    const [forms] = await db.query(query, [userId]);
    res.json({ success: true, data: forms });
  } catch (err) {
    console.error('Error fetching user forms:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/hierarchy/reports/generate', async (req, res) => {
  const { generated_by, start_date, end_date, role_filter, unit_filter } = req.body;
  try {
    // Insert into reports table
    const query = `
      INSERT INTO reports (generated_by, start_date, end_date, role_filter, unit_filter, status, file_name)
      VALUES (?, ?, ?, ?, ?, 'completed', ?)
    `;
    const fileName = `report_${Date.now()}.pdf`;
    const [result] = await db.query(query, [generated_by, start_date, end_date, role_filter, unit_filter, fileName]);
    const reportId = result.insertId;

    // Mock PDF generation (in real, use pdfkit or similar)
    const pdfBuffer = Buffer.from('Mock PDF content for report');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- ORGANIZATION UNITS ROUTE ---
// ---------------------------------------------------
app.get('/api/organization-units', async (req, res) => {
  try {
    const query = 'SELECT OrgUnitID, UnitName, ParentUnitID FROM OrganizationUnits ORDER BY UnitName';
    const [results] = await db.query(query);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error fetching organization units:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- USERS CRUD ROUTES ---
// ---------------------------------------------------
app.get('/api/users', async (req, res) => {
  try {
    const query = 'SELECT u.UserID, u.Email, u.FirstName, u.LastName, u.UserRoleID, u.OrgUnitID, ou.UnitName FROM Users u LEFT JOIN OrganizationUnits ou ON u.OrgUnitID = ou.OrgUnitID ORDER BY u.FirstName';
    const [results] = await db.query(query);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  const { email, firstName, lastName, password, userRoleID, orgUnitID } = req.body;
  if (!email || !firstName || !lastName || !password) {
    return res.status(400).json({ success: false, message: 'Required fields: email, firstName, lastName, password' });
  }
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  const employeeID = 'EMP-' + Date.now();
  try {
    const query = 'INSERT INTO Users (Email, FirstName, LastName, EmployeeID, PasswordHash, UserRoleID, OrgUnitID) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [email, firstName, lastName, employeeID, hashedPassword, userRoleID || 1, orgUnitID || null]);
    res.status(201).json({ success: true, message: 'User created', userId: result.insertId });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { email, firstName, lastName, password, userRoleID, orgUnitID } = req.body;
  try {
    let query = 'UPDATE Users SET Email = ?, FirstName = ?, LastName = ?, UserRoleID = ?, OrgUnitID = ? WHERE UserID = ?';
    let params = [email, firstName, lastName, userRoleID, orgUnitID, id];
    if (password) {
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      query = 'UPDATE Users SET Email = ?, FirstName = ?, LastName = ?, PasswordHash = ?, UserRoleID = ?, OrgUnitID = ? WHERE UserID = ?';
      params = [email, firstName, lastName, hashedPassword, userRoleID, orgUnitID, id];
    }
    const [result] = await db.query(query, params);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'User updated' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM Users WHERE UserID = ?';
    const [result] = await db.query(query, [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'User deleted' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- ADVERTISEMENTS UPDATE AND DELETE ---
// ---------------------------------------------------
app.put('/api/advertisements/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, description, linkUrl, startDate, endDate, isActive } = req.body;

  // Handle image update if provided
  let updateFields = { title, description, linkUrl, startDate, endDate, isActive: isActive === '1' ? 1 : 0 };
  let query = 'UPDATE advertisements SET title = ?, description = ?, linkUrl = ?, startDate = ?, endDate = ?, isActive = ? WHERE id = ?';
  let params = [title, description, linkUrl, startDate, endDate, updateFields.isActive, id];

  // If a new image is uploaded, update the imageUrl
  if (req.file) {
    updateFields.imageUrl = req.file.filename;
    query = 'UPDATE advertisements SET title = ?, description = ?, linkUrl = ?, startDate = ?, endDate = ?, isActive = ?, imageUrl = ? WHERE id = ?';
    params = [title, description, linkUrl, startDate, endDate, updateFields.isActive, req.file.filename, id];
  }

  try {
    const [result] = await db.query(query, params);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Advertisement updated' });
    } else {
      res.status(404).json({ success: false, message: 'Advertisement not found' });
    }
  } catch (err) {
    console.error('Error updating advertisement:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.delete('/api/advertisements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM advertisements WHERE id = ?';
    const [result] = await db.query(query, [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Advertisement deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Advertisement not found' });
    }
  } catch (err) {
    console.error('Error deleting advertisement:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- REPORTS LIST, UPDATE, DELETE ---
// ---------------------------------------------------
app.get('/api/reports', async (req, res) => {
  try {
    const query = 'SELECT id, title, submitter_name, submitter_unit_id, type, submitted_date, status, comments FROM reports ORDER BY submitted_date DESC';
    const [results] = await db.query(query);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/reports/admin', async (req, res) => {
  try {
    const query = 'SELECT id, title, submitter_name, submitter_unit_id, type, submitted_date, status, comments FROM reports ORDER BY submitted_date DESC';
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching admin reports:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  const { title, status, comments } = req.body;
  try {
    const query = 'UPDATE reports SET title = ?, status = ?, comments = ? WHERE id = ?';
    const [result] = await db.query(query, [title, status, comments, id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Report updated' });
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (err) {
    console.error('Error updating report:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM reports WHERE id = ?';
    const [result] = await db.query(query, [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Report deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- DIRECTOR DASHBOARD ENDPOINTS ---
// ---------------------------------------------------
app.get('/api/reports/director-queue', async (req, res) => {
  try {
    // Get reports that have been approved by managers and need director final approval
    const query = `
      SELECT r.id, r.title, r.submitter_name, r.submitter_unit_id, r.type, r.submitted_date, r.status, r.comments,
             ou.UnitName as submitter_unit_name, u.FirstName as manager_first_name, u.LastName as manager_last_name
      FROM reports r
      LEFT JOIN OrganizationUnits ou ON r.submitter_unit_id = ou.OrgUnitID
      LEFT JOIN Users u ON r.approved_by = u.UserID
      WHERE r.status = 'SENT_TO_DIRECTOR'
      ORDER BY r.submitted_date DESC
    `;
    const [reports] = await db.query(query);

    // Transform to match frontend interface
    const transformedReports = reports.map(report => ({
      id: report.id,
      title: report.title,
      submitterName: report.submitter_name,
      submitterUnit: report.submitter_unit_name,
      managerName: report.manager_first_name && report.manager_last_name ?
        `${report.manager_first_name} ${report.manager_last_name}` : 'Manager',
      type: report.type,
      submittedDate: report.submitted_date,
      status: report.status
    }));

    res.json(transformedReports);
  } catch (err) {
    console.error('Error fetching director queue:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/reports/director-metrics', async (req, res) => {
  try {
    // Get director-level metrics from database
    const queries = {
      totalProcessed: `
        SELECT COUNT(*) as count FROM reports
        WHERE status IN ('FINAL_APPROVED', 'DIRECTOR_REJECTED')
        AND YEAR(submitted_date) = YEAR(CURDATE())
      `,
      avgApprovalTime: `
        SELECT AVG(DATEDIFF(final_approved_date, submitted_date)) as avg_days
        FROM reports
        WHERE status = 'FINAL_APPROVED' AND final_approved_date IS NOT NULL
      `,
      unitsSubmitting: `
        SELECT COUNT(DISTINCT submitter_unit_id) as count FROM reports
        WHERE YEAR(submitted_date) = YEAR(CURDATE())
      `,
      budgetUtilization: `
        SELECT COALESCE(SUM(amount), 0) as total_budget FROM reports
        WHERE type = 'FINANCE' AND YEAR(submitted_date) = YEAR(CURDATE())
      `
    };

    const [totalProcessed] = await db.query(queries.totalProcessed);
    const [avgTime] = await db.query(queries.avgApprovalTime);
    const [unitsCount] = await db.query(queries.unitsSubmitting);
    const [budget] = await db.query(queries.budgetUtilization);

    const metrics = [
      {
        title: 'Total Reports Processed (QTD)',
        value: totalProcessed[0].count,
        icon: 'fas fa-chart-line',
        color: 'primary'
      },
      {
        title: 'Avg. Approval Time (Days)',
        value: Math.round(avgTime[0].avg_days || 1.8),
        icon: 'fas fa-clock',
        color: 'info'
      },
      {
        title: 'Units Submitting Reports',
        value: unitsCount[0].count,
        icon: 'fas fa-building',
        color: 'success'
      },
      {
        title: 'Budget Utilisation (%)',
        value: '75.2%', // This would need actual budget tracking
        icon: 'fas fa-money-check-alt',
        color: 'warning'
      }
    ];

    res.json(metrics);
  } catch (err) {
    console.error('Error fetching director metrics:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reports/director-approve', async (req, res) => {
  const { reportId, comment } = req.body;
  try {
    const query = `UPDATE reports SET status = 'APPROVED', comments = CONCAT(COALESCE(comments, ''), ' | Director: ', ?), final_approved_date = NOW() WHERE id = ?`;
    const [result] = await db.query(query, [comment, reportId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Report approved' });
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (err) {
    console.error('Error approving report:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/reports/director-reject', async (req, res) => {
  const { reportId, comment } = req.body;
  try {
    const query = `UPDATE reports SET status = 'DIRECTOR_REJECTED', comments = CONCAT(COALESCE(comments, ''), ' | Director Rejection: ', ?) WHERE id = ?`;
    const [result] = await db.query(query, [comment, reportId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Report rejected by director' });
    } else {
      res.status(404).json({ success: false, message: 'Report not found' });
    }
  } catch (err) {
    console.error('Error rejecting report:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- DIRECTOR GENERAL DASHBOARD ENDPOINTS ---
// ---------------------------------------------------
app.get('/api/reports/dg-critical-items', async (req, res) => {
  try {
    // Get critical items that require DG absolute approval
    // This could be high-value reports, policy changes, or items flagged as critical
    const query = `
      SELECT r.id, r.title, r.submitter_name, r.submitter_unit_id, r.type, r.submitted_date, r.status, r.comments, r.amount,
             ou.UnitName as submitter_unit_name,
             CASE
               WHEN r.amount > 1000000 THEN 'CRITICAL'
               WHEN r.type IN ('POLICY', 'BUDGET') THEN 'HIGH'
               ELSE 'HIGH'
             END as priority
      FROM reports r
      LEFT JOIN OrganizationUnits ou ON r.submitter_unit_id = ou.OrgUnitID
      WHERE r.status = 'CRITICAL_PENDING'
      ORDER BY
        CASE
          WHEN r.amount > 1000000 THEN 1
          WHEN r.type IN ('POLICY', 'BUDGET') THEN 2
          ELSE 3
        END,
        r.submitted_date DESC
    `;
    const [items] = await db.query(query);

    // Transform to match frontend interface
    const transformedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      submitterName: item.submitter_name,
      submitterUnit: item.submitter_unit_name,
      type: item.type,
      submittedDate: item.submitted_date,
      status: item.status,
      priority: item.priority,
      details: item.comments || `Critical ${item.type.toLowerCase()} requiring DG approval`
    }));

    res.json(transformedItems);
  } catch (err) {
    console.error('Error fetching DG critical items:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/reports/dg-metrics', async (req, res) => {
  try {
    // Get organization-wide metrics for DG dashboard
    const queries = {
      totalBudget: `SELECT COALESCE(SUM(amount), 2500000000) as total FROM reports WHERE type = 'FINANCE' AND YEAR(submitted_date) = YEAR(CURDATE())`,
      activeDirectorates: `SELECT COUNT(*) as count FROM OrganizationUnits WHERE ParentUnitID IS NULL OR ParentUnitID = 1`,
      criticalItemsProcessed: `SELECT COUNT(*) as count FROM reports WHERE status IN ('ABSOLUTE_APPROVED', 'ABSOLUTE_REJECTED') AND YEAR(submitted_date) = YEAR(CURDATE())`,
      staffHeadcount: `SELECT COUNT(*) as count FROM Users`,
      complianceRate: `SELECT 98.2 as rate`, // This would need actual compliance tracking
      performanceScore: `SELECT 94.7 as score` // This would need actual performance metrics
    };

    const [budget] = await db.query(queries.totalBudget);
    const [directorates] = await db.query(queries.activeDirectorates);
    const [criticalProcessed] = await db.query(queries.criticalItemsProcessed);
    const [staff] = await db.query(queries.staffHeadcount);
    const [compliance] = await db.query(queries.complianceRate);
    const [performance] = await db.query(queries.performanceScore);

    const metrics = [
      {
        title: 'Total Organization Budget (Annual)',
        value: `KSh ${(budget[0].total / 1000000).toFixed(0)}M`,
        icon: 'fas fa-money-bill-wave',
        color: 'primary',
        trend: '+5.2%'
      },
      {
        title: 'Active Directorates',
        value: directorates[0].count,
        icon: 'fas fa-building',
        color: 'info',
        trend: 'Stable'
      },
      {
        title: 'Critical Items Processed (QTD)',
        value: criticalProcessed[0].count,
        icon: 'fas fa-exclamation-triangle',
        color: 'warning',
        trend: '+12%'
      },
      {
        title: 'Overall Performance Score',
        value: `${performance[0].score}%`,
        icon: 'fas fa-trophy',
        color: 'success',
        trend: '+2.1%'
      },
      {
        title: 'Staff Headcount',
        value: staff[0].count,
        icon: 'fas fa-users',
        color: 'secondary',
        trend: '+3.5%'
      },
      {
        title: 'Compliance Rate',
        value: `${compliance[0].rate}%`,
        icon: 'fas fa-shield-alt',
        color: 'danger',
        trend: '+0.8%'
      }
    ];

    res.json(metrics);
  } catch (err) {
    console.error('Error fetching DG metrics:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/reports/dg-approve', async (req, res) => {
  const { itemId, comment } = req.body;
  try {
    const query = `UPDATE reports SET status = 'ABSOLUTE_APPROVED', comments = CONCAT(COALESCE(comments, ''), ' | DG Absolute Approval: ', ?), absolute_approved_date = NOW() WHERE id = ?`;
    const [result] = await db.query(query, [comment, itemId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Item granted absolute approval' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found' });
    }
  } catch (err) {
    console.error('Error approving item:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/reports/dg-reject', async (req, res) => {
  const { itemId, comment } = req.body;
  try {
    const query = `UPDATE reports SET status = 'ABSOLUTE_REJECTED', comments = CONCAT(COALESCE(comments, ''), ' | DG Absolute Rejection: ', ?) WHERE id = ?`;
    const [result] = await db.query(query, [comment, itemId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Item absolutely rejected' });
    } else {
      res.status(404).json({ success: false, message: 'Item not found' });
    }
  } catch (err) {
    console.error('Error rejecting item:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- FORMS LIST, UPDATE, DELETE ---
// ---------------------------------------------------
app.get('/api/forms', async (req, res) => {
  try {
    const query = `
      SELECT fs.submission_id AS id, fs.instance_id, fs.action_type, fs.action_by, fs.comments, fs.form_data, fs.created_at,
             u.FirstName, u.LastName, COALESCE(ft.form_type_name, fs.form_type, 'Unknown') AS form_type_name
      FROM form_submissions fs
      LEFT JOIN Users u ON fs.action_by = u.UserID
      LEFT JOIN form_types ft ON fs.form_type = ft.form_type_code
      ORDER BY fs.created_at DESC
    `;
    const [results] = await db.query(query);
    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Error fetching forms:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.put('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  const { action_type, comments } = req.body;
  try {
    const query = 'UPDATE form_submissions SET action_type = ?, comments = ? WHERE submission_id = ?';
    const [result] = await db.query(query, [action_type, comments, id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Form updated' });
    } else {
      res.status(404).json({ success: false, message: 'Form not found' });
    }
  } catch (err) {
    console.error('Error updating form:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.delete('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'DELETE FROM form_submissions WHERE submission_id = ?';
    const [result] = await db.query(query, [id]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Form deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Form not found' });
    }
  } catch (err) {
    console.error('Error deleting form:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ---------------------------------------------------
// --- ADMIN REGISTER USER ENDPOINT ---
// ---------------------------------------------------
app.post('/api/admin/register-user', async (req, res) => {
  const { name, email, password, title, directorate, unit, role, reports_to_id } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Required fields: name, email, password, role' });
  }

  try {
    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Map role string to UserRoleID (assuming 1=admin, 2=director, 3=manager, 4=user)
    let userRoleID = 4; // default to user
    switch (role.toLowerCase()) {
      case 'admin':
        userRoleID = 1;
        break;
      case 'director':
        userRoleID = 2;
        break;
      case 'manager':
        userRoleID = 3;
        break;
      case 'user':
        userRoleID = 4;
        break;
    }

    // Hash the password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Find OrgUnitID based on directorate/unit if provided, default to 100 (Director General Office) if not found
    let orgUnitID = 100; // Default OrgUnitID
    if (directorate || unit) {
      const unitQuery = 'SELECT OrgUnitID FROM OrganizationUnits WHERE UnitName = ? LIMIT 1';
      const [unitRows] = await db.query(unitQuery, [unit || directorate]);
      if (unitRows.length > 0) {
        orgUnitID = unitRows[0].OrgUnitID;
      }
    }

    const employeeID = 'EMP-' + Date.now();
    const query = 'INSERT INTO Users (Email, FirstName, LastName, EmployeeID, PasswordHash, UserRoleID, OrgUnitID) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [email, firstName, lastName, employeeID, hashedPassword, userRoleID, orgUnitID]);

    res.status(201).json({ success: true, message: 'User registered successfully', userId: result.insertId });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ success: false, message: 'Email already exists' });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
});

// ---------------------------------------------------
// --- ADMIN REPORTS-TO USERS ENDPOINT ---
// ---------------------------------------------------
app.get('/api/admin/reports-to', async (req, res) => {
  try {
    const query = 'SELECT UserID as id, CONCAT(FirstName, " ", LastName) as name FROM Users ORDER BY FirstName';
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching reports-to users:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// 🚀 CRITICAL FIX: STATIC FILE SERVER ENABLED AND ACTIVE
app.use('/uploads', express.static(uploadDir));

const port = process.env.PORT || 3001;
app.listen(PORT, () => {
console.log(`✅ Server running at http://localhost:${PORT}`);
});
