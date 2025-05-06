const fs = require('fs');
const path = require('path');

function bumpVersion(fileName) {
    const packagePath = path.join(process.cwd(), fileName);
    const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // Split version and increment minor
    const [major, minor, patch] = package.version.split('.');
    package.version = `${major}.${parseInt(minor)+1}.${patch}`;

    // Write back to package.json
    fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));

    console.log(`Version bumped to ${package.version}`);

}

try {
    // Read the package.json file
    bumpVersion('package.json');
    bumpVersion('manifest.json');
} catch (err) {
    console.error('Error bumping version:', err);
}