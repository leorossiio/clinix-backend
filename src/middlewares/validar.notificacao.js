import Joi from 'joi';

const schema = Joi.object({
    titulo: Joi.string().required(),
    mensagem: Joi.string().required()
});

export const validarNotificacao = (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    next();
};
