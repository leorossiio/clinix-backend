import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export const autenticacao = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.usuario = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};


export const autorizar = (tiposPermitidos) => {
    return (req, res, next) => {
      const tipoUsuario = req.usuario.tipo;
      
      if (!tiposPermitidos.includes(tipoUsuario)) {
        return res.status(403).json({ error: 'Acesso não autorizado.' });
      }
      
      next();
    };
  };
  