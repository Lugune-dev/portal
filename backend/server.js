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
 host: 'localhost',
user: 'sheddy',
 password: '**Lugun7',
 database: 'tphpa'
}).promise();

db.connect((err) => {
 if (err) {
 console.error('❌ DB connection error:', err);
} else {
console.log('✅ MySQL Connected');
}
});

app.get('/api/health', (req, res) => {
res.json({ status: 'ok' });
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
ff.options
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
    // Get reports from the manager's unit that are pending and require manager review
    const query = `
      SELECT r.id, r.title, r.submitter_name, r.submitter_unit_id, r.type, r.submitted_date, r.status, r.comments
      FROM reports r
      LEFT JOIN ReportWorkflows rw ON r.type = rw.ReportType
      WHERE r.submitter_unit_id = ? AND r.status = 'PENDING'
      AND (rw.ReviewerRoleID = 3 OR rw.ReviewerRoleID IS NULL)
      ORDER BY r.submitted_date DESC
    `;
    const [reports] = await db.query(query, [managerUnitId]);
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
    const query = `UPDATE reports SET status = 'APPROVED', comments = ? WHERE id = ?`;
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
      UPDATE form_submissions SET action_type = 'approve', action_by = ?, comments = ?
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
    const query = `
      SELECT fs.submission_id AS id, fs.instance_id, fs.action_type, fs.action_by, fs.comments, fs.form_data, fs.created_at,
             COALESCE(ft.form_type_name, fs.form_type, 'Unknown') AS form_type_name, ft.form_type_code
      FROM form_submissions fs
      LEFT JOIN form_types ft ON fs.form_type = ft.form_type_code
      WHERE fs.action_by = ?
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

// 🚀 CRITICAL FIX: STATIC FILE SERVER ENABLED AND ACTIVE
app.use('/uploads', express.static(uploadDir));

const PORT = 3001;
app.listen(PORT, () => {
console.log(`✅ Server running at http://localhost:${PORT}`);
});
