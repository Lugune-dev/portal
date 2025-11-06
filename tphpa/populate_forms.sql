-- Insert form types
INSERT INTO form_types (form_type_name, form_type_code) VALUES
('Retirement of Imprest', 'RETIREMENT_IMPREST'),
('Safari Imprest', 'SAFARI_IMPREST'),
('Special Imprest', 'SPECIAL_IMPREST'),
('Claim Form', 'CLAIM_FORM'),
('Outstanding Imprest', 'OUTSTANDING_IMPREST'),
('Petty Cash Voucher', 'PETTY_CASH');

-- Get the IDs (assuming auto increment starts from 1, adjust if needed)
-- For RETIREMENT_IMPREST (id=1)
INSERT INTO form_sections (form_type_id, section_name, section_order, is_repeatable, max_repeats) VALUES
(1, 'Personal Information', 1, 0, NULL),
(1, 'Bank Details', 2, 0, NULL),
(1, 'Documents', 3, 0, NULL);

INSERT INTO form_fields (section_id, field_name, field_label, field_type, field_order, is_required, default_value, placeholder_text, validation_rules, options) VALUES
-- Personal Information section (section_id=1)
(1, 'name', 'Full Name', 'text', 1, 1, NULL, 'Enter your full name', NULL, NULL),
(1, 'employee_id', 'Employee ID', 'text', 2, 1, NULL, 'Enter employee ID', NULL, NULL),
(1, 'department', 'Department', 'text', 3, 1, NULL, 'Enter department', NULL, NULL),
(1, 'date_of_birth', 'Date of Birth', 'date', 4, 1, NULL, NULL, NULL, NULL),
(1, 'retirement_date', 'Retirement Date', 'date', 5, 1, NULL, NULL, NULL, NULL),
-- Bank Details section (section_id=2)
(2, 'bank_name', 'Bank Name', 'text', 1, 1, NULL, 'Enter bank name', NULL, NULL),
(2, 'account_number', 'Account Number', 'text', 2, 1, NULL, 'Enter account number', NULL, NULL),
(2, 'branch_name', 'Branch Name', 'text', 3, 1, NULL, 'Enter branch name', NULL, NULL),
-- Documents section (section_id=3)
(3, 'documents', 'Upload Documents', 'file', 1, 0, NULL, 'Upload retirement documents', NULL, NULL);

-- For SAFARI_IMPREST (id=2)
INSERT INTO form_sections (form_type_id, section_name, section_order, is_repeatable, max_repeats) VALUES
(2, 'Trip Details', 1, 0, NULL),
(2, 'Budget Information', 2, 0, NULL);

INSERT INTO form_fields (section_id, field_name, field_label, field_type, field_order, is_required, default_value, placeholder_text, validation_rules, options) VALUES
-- Trip Details (section_id=4)
(4, 'destination', 'Destination', 'text', 1, 1, NULL, 'Enter destination', NULL, NULL),
(4, 'departure_date', 'Departure Date', 'date', 2, 1, NULL, NULL, NULL, NULL),
(4, 'return_date', 'Return Date', 'date', 3, 1, NULL, NULL, NULL, NULL),
(4, 'purpose', 'Purpose of Trip', 'textarea', 4, 1, NULL, 'Describe the purpose', NULL, NULL),
-- Budget Information (section_id=5)
(5, 'estimated_cost', 'Estimated Cost', 'number', 1, 1, NULL, 'Enter estimated cost', NULL, NULL),
(5, 'currency', 'Currency', 'select', 2, 1, NULL, NULL, NULL, '[{"value": "USD", "label": "USD"}, {"value": "EUR", "label": "EUR"}, {"value": "KES", "label": "KES"}]');

-- For SPECIAL_IMPREST (id=3)
INSERT INTO form_sections (form_type_id, section_name, section_order, is_repeatable, max_repeats) VALUES
(3, 'Request Details', 1, 0, NULL);

INSERT INTO form_fields (section_id, field_name, field_label, field_type, field_order, is_required, default_value, placeholder_text, validation_rules, options) VALUES
(6, 'amount', 'Amount Requested', 'number', 1, 1, NULL, 'Enter amount', NULL, NULL),
(6, 'purpose', 'Purpose', 'textarea', 2, 1, NULL, 'Describe the purpose', NULL, NULL),
(6, 'urgency', 'Urgency Level', 'select', 3, 1, NULL, NULL, NULL, '[{"value": "low", "label": "Low"}, {"value": "medium", "label": "Medium"}, {"value": "high", "label": "High"}]');

-- For CLAIM_FORM (id=4)
INSERT INTO form_sections (form_type_id, section_name, section_order, is_repeatable, max_repeats) VALUES
(4, 'Claim Details', 1, 0, NULL),
(4, 'Expenses', 2, 1, 10); -- Repeatable

INSERT INTO form_fields (section_id, field_name, field_label, field_type, field_order, is_required, default_value, placeholder_text, validation_rules, options) VALUES
-- Claim Details (section_id=7)
(7, 'claim_date', 'Claim Date', 'date', 1, 1, NULL, NULL, NULL, NULL),
(7, 'total_amount', 'Total Amount', 'number', 2, 1, NULL, 'Enter total amount', NULL, NULL),
-- Expenses (section_id=8, repeatable)
(8, 'expense_date', 'Expense Date', 'date', 1, 1, NULL, NULL, NULL, NULL),
(8, 'description', 'Description', 'text', 2, 1, NULL, 'Describe the expense', NULL, NULL),
(8, 'category', 'Category', 'select', 3, 1, NULL, NULL, NULL, '[{"value": "travel", "label": "Travel"}, {"value": "meals", "label": "Meals"}, {"value": "supplies", "label": "Supplies"}]'),
(8, 'amount', 'Amount', 'number', 4, 1, NULL, 'Enter amount', NULL, NULL);

-- For OUTSTANDING_IMPREST (id=5)
INSERT INTO form_sections (form_type_id, section_name, section_order, is_repeatable, max_repeats) VALUES
(5, 'Outstanding Details', 1, 0, NULL);

INSERT INTO form_fields (section_id, field_name, field_label, field_type, field_order, is_required, default_value, placeholder_text, validation_rules, options) VALUES
(9, 'original_imprest_ref', 'Original Imprest Reference', 'text', 1, 1, NULL, 'Enter reference', NULL, NULL),
(9, 'outstanding_amount', 'Outstanding Amount', 'number', 2, 1, NULL, 'Enter outstanding amount', NULL, NULL),
(9, 'reason', 'Reason for Outstanding', 'textarea', 3, 1, NULL, 'Explain the reason', NULL, NULL);

-- For PETTY_CASH (id=6)
INSERT INTO form_sections (form_type_id, section_name, section_order, is_repeatable, max_repeats) VALUES
