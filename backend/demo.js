const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

// --- LOGIN ROUTE ---
// --- LOGIN ROUTE (Modified for debug) ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.query(query, [email]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        if (user.password_hash === hashedPassword) {
            delete user.password_hash;
            
            // 🔑 CRITICAL DEBUG LOG: Print the exact user object being sent
            console.log(`✅ Login successful for ${user.email}. User object sent:`, {
                id: user.id,
                email: user.email,
                role: user.role // <-- Check this value carefully in your server logs
            });

            return res.status(200).json({ message: 'Login successful', user: user });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// --- ADVERTISEMENT UPLOAD ---
// Node.js Server file

// Node.js Server file - Corrected

app.post('/api/advertisements', upload.single('image'), async (req, res) => {
  // Destructure all the fields you need from the request body
  const { title, description, linkUrl, startDate, endDate, isActive } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  if (!imagePath) {
    return res.status(400).json({ message: 'Image file is required' });
  }

  // 🔑 CRITICAL FIX: Convert the incoming string 'true'/'false' to the integer 1 or 0.
  // The frontend sends 'true' as a string when using FormData.
  const isActiveDbValue = isActive === 'true' ? 1 : 0; 

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

// --- ADVERTISEMENT FETCH (FIXED IMAGE URL) ---
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
// app.post('/api/forms/submit/:formType', async (req, res) => { /* ... */ });
// app.get('/api/forms/config/:formType', async (req, res) => { /* ... */ });
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

  // Use JSON.stringify to ensure the data is stored correctly as a JSON string
  const formDataJson = JSON.stringify(formData);

  const query = `
    INSERT INTO form_submissions (instance_id, action_type, action_by, comments, form_data)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.execute(query, [
      instance_id,
      action_type,
      action_by,
      comments,
      formDataJson
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
            validation_rules: row.validation_rules,
            options: row.options
          };

          // Improved JSON parsing with better error handling
          const parseJsonField = (fieldValue, fieldName) => {
            if (!fieldValue) return null;
            // If it's already an object, return as-is
            if (typeof fieldValue === 'object') {
              return fieldValue;
            }
            // If it's a string, try to parse it
            if (typeof fieldValue === 'string') {
              try {
                // Check if it looks like JSON (starts with { or [)
                if (fieldValue.trim().startsWith('{') || fieldValue.trim().startsWith('[')) {
                  return JSON.parse(fieldValue);
                }
                // If it doesn't look like JSON but we expect it to be, try parsing anyway
                try {
                  return JSON.parse(fieldValue);
                } catch (e) {
                  console.warn(`Field ${fieldName} contains non-JSON string:`, fieldValue);
                  return fieldValue; // Return the string as-is
                }
              } catch (parseError) {
                console.warn(`Failed to parse ${fieldName}:`, parseError.message, 'Value:', fieldValue);
                return fieldValue; // Return the original value
              }
            }
            return fieldValue;
          };

          field.validation_rules = parseJsonField(row.validation_rules, 'validation_rules');
          field.options = parseJsonField(row.options, 'options');

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

// Add this debug endpoint to check JSON fields
app.get('/api/debug/json-fields', async (req, res) => {

  const query = `
    SELECT
      field_id,
      field_name,
      validation_rules,
      options,
      LENGTH(validation_rules) as validation_rules_length,
      LENGTH(options) as options_length,
      typeof(validation_rules) as validation_rules_type,
      typeof(options) as options_type
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

// --- HIERARCHY AND REPORTS ROUTES ---
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
    const query = `
      SELECT * FROM form_submissions 
      WHERE action_by = ? OR instance_id IN (SELECT id FROM users WHERE reporting_to = ?)
    `;
    const [forms] = await db.query(query, [userId, userId]);
    res.json({ success: true, data: forms });
  } catch (err) {
    console.error('Error fetching subordinate forms:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/forms/approve/:formId', async (req, res) => {
  const { formId } = req.params;
  const { approverId, comments } = req.body;
  try {
    const query = `
      UPDATE form_submissions SET action_type = 'approved', action_by = ?, comments = ? 
      WHERE id = ?
    `;
    const [result] = await db.query(query, [approverId, comments, formId]);
    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Form approved' });
    } else {
      res.status(404).json({ success: false, message: 'Form not found' });
    }
  } catch (err) {
    console.error('Error approving form:', err);
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

// 🚀 CRITICAL FIX: STATIC FILE SERVER ENABLED AND ACTIVE 
app.use('/uploads', express.static(uploadDir)); 

const PORT = 3001;
app.listen(PORT, () => {
console.log(`✅ Server running at http://localhost:${PORT}`);
});
