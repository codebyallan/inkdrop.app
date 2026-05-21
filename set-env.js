const fs = require('fs');
const path = require('path');

// Path to the production environment file
const targetPath = path.join(__dirname, 'src/environments/environment.ts');

// Collect variables from process.env (system)
// Use a default fallback value if not provided
const config = {
  production: true,
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
};

// Build the file content in TypeScript format
const envConfigFile = `export const environment = ${JSON.stringify(config, null, 2)};
`;

try {
  fs.writeFileSync(targetPath, envConfigFile);
  console.log('✅ Environment file generated successfully at:', targetPath);
} catch (error) {
  console.error('❌ Error generating environment file:', error);
  process.exit(1);
}
