import { initializeDatabase } from './src/database/db.js';

console.log('Testing database initialization...');
initializeDatabase()
    .then(() => {
        console.log('Database initialized successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Database initialization failed:', err);
        process.exit(1);
    });
