// Vulnerable: Hardcoded private key and SSH credentials
const SSH_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF8PbnGcY5unA67hq5lOYsFJBiXSI
nGBR3i25GDQ2kShSJtgJBHSuUenwJMOy0zCV2cGIBOx5RjMiPlCc9J+B7PnkxFOk
c9Lc9wSll3eE2+MPRe7J5FQj0EXAMPLEKEYHERE
-----END RSA PRIVATE KEY-----`;

const DB_CONNECTION = {
  host: "prod-db.internal.com",
  user: "root",
  password: "r00tP@ssw0rd!",
  privateKey: SSH_PRIVATE_KEY
};
