import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export const gerarToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

export const verificarToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};
