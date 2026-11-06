const developmentSecret = 'finora-local-development-secret-change-before-deploy';
const configuredSecret = process.env.JWT_SECRET;

if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters in production.');
}

export const JWT_SECRET = configuredSecret || developmentSecret;
