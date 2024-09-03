import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current module's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the workflow file inside the npm package
const sourcePath = path.join(__dirname, '../../workflows/review.yml');

// Path to the destination in the consuming project
const destDir = path.join(process.cwd(), '.github', 'workflows');
const destPath = path.join(destDir, 'review.yml');

// Create the directories if they don't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy the file
fs.copyFileSync(sourcePath, destPath);

console.log('review.yml has been copied to .github/workflows/review.yml');
