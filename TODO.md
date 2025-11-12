# TODO: Implement Secure External Approval Process for Forms

## Completed Tasks
- [x] Add signature field_type to FormField interface
- [x] Update dynamic forms component to handle signature fields
- [x] Implement dashboard signing for Head of Project/Section
- [x] Implement read-only audit trail display for Director/DG signatures

## Pending Tasks
- [ ] Backend API endpoints for signature approval workflow
- [ ] Email notification system for external approvals
- [ ] External approval portal/dashboard for Director and DG
- [ ] Form configuration to include signature fields with proper signature_type
- [ ] Audit trail logging for all signature actions
- [ ] Integration with user hierarchy for approval routing
- [ ] Security measures for external approval links (token-based authentication)
- [ ] Testing of signature workflow end-to-end

## Implementation Notes
- Signature fields support two types:
  - `dashboard`: Interactive signing within the form (Head of Project/Section)
  - `external`: Read-only audit trail showing approval details (Director/DG)
- Signature data is stored as JSON with: signed_by, signed_by_name, signed_at, signature_type
- External approvals should be handled via secure email links or dedicated portal
- All signature actions should be logged for audit purposes
