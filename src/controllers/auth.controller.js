import jwt from 'jsonwebtoken';
import { buscarUsuarioPorEmail } from '../repositories/usuario.repository.js';
import { JWT_SECRET } from '../config.js';

export const login = async (req, res) => {
  const { email, senha } = req.body;

  const { data: usuario, error } = await buscarUsuarioPorEmail(email);
  if (error || !usuario) return res.status(401).json({ error: 'Credenciais inválidas.' });

  if (usuario.senha !== senha) return res.status(401).json({ error: 'Credenciais inválidas.' });

  // DEBUG: imprime o usuário pra garantir que tipo está vindo
  // console.log('Usuário autenticado:', usuario);

  const token = jwt.sign(
    {
      id: usuario.id_usuario,
      tipo: usuario.tipo_usuario // ← este valor precisa estar definido
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // console.log('Token gerado:', token);

  res.json({ token });
};
