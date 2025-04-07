import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export const autenticacao = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Verifica o token

    // Salva no req.user o usuário autenticado
    req.usuario = decoded;

    next(); // Se tudo estiver certo, continua para o próximo middleware ou endpoint
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};


export const autorizar = (tiposPermitidos) => {
    return (req, res, next) => {
      const tipoUsuario = req.usuario.tipo;  // Acessa o tipo de usuário do token (verificado anteriormente)
      
      // Verifica se o tipo de usuário está permitido
      if (!tiposPermitidos.includes(tipoUsuario)) {
        return res.status(403).json({ error: 'Acesso não autorizado.' });
      }
      
      next();  // Se permitido, passa para o próximo middleware ou endpoint
    };
  };
  