import crypto from 'crypto';

function hashContent(buf) {
    return crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
}

export { hashContent }; 