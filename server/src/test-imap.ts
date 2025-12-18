
import imap from 'imap-simple';
import dotenv from 'dotenv';
dotenv.config();

const config = {
    imap: {
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        host: process.env.EMAIL_HOST || 'imap.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '993'),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000
    }
};

async function testConnection() {
    console.log('Testing connection with config:', { ...config.imap, password: '***' });
    try {
        const connection = await imap.connect(config);
        console.log('Connected!');
        await connection.openBox('INBOX');
        console.log('Box opened!');
        const searchCriteria = ['ALL'];
        const fetchOptions = { bodies: ['HEADER'], markSeen: false };
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log(`Found ${messages.length} emails`);
        connection.end();
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

testConnection();
