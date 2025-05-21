import jwt from 'jsonwebtoken';
import { buscarUsuarioPorEmail } from '../repositories/usuario.repository.js';
import { JWT_SECRET } from '../config.js';

export const login = async (req, res) => {
  const { email, senha } = req.body;

  const { data: usuario, error } = await buscarUsuarioPorEmail(email);
  if (error || !usuario) return res.status(401).json({ error: 'Credenciais inválidas.' });

  if (usuario.senha !== senha) return res.status(401).json({ error: 'Credenciais inválidas.' });

  const token = jwt.sign(
    {
      id: usuario.id_usuario,
      tipo: usuario.tipo_usuario
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
};
