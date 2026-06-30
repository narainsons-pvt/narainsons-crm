function validatePAN(pan) {
  if (!pan) return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(String(pan).trim().toUpperCase());
}

function validateMobile(mobile) {
  if (!mobile) return false;
  return /^[6-9][0-9]{9}$/.test(String(mobile).trim());
}

function validateCustomer(row) {
  const errors = [];

  if (!row.pan_number) {
    errors.push("PAN Number is required");
  } else if (!validatePAN(row.pan_number)) {
    errors.push("Invalid PAN format");
  }

  if (!row.customer_name) {
    errors.push("Customer Name is required");
  }

  if (!row.mobile_number) {
    errors.push("Mobile Number is required");
  } else if (!validateMobile(row.mobile_number)) {
    errors.push("Invalid Mobile Number");
  }

  return errors;
}

module.exports = {
  validatePAN,
  validateMobile,
  validateCustomer
};