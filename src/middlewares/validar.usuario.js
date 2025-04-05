import Joi from 'joi';

const schema = Joi.object({
    nome: Joi.string().required(),
    email: Joi.string().email().required()
});

export const validarUsuario = (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    next();
};