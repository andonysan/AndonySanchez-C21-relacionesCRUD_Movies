const {check, body} = require('express-validator')

module.exports = [
    check('title')
        .notEmpty().withMessage('Es obligatorio')
        .isLength({
            min: 4,
            max: 50
        }).withMessage('Debe de tener entre 5 y 50 caracteres'),
    check('rating')
        .notEmpty().withMessage('Es obligatorio')
        .custom(value => value >= 1? true : false).withMessage('Debe de ser positivo y mayor que 0'),
    body('awards')
        .notEmpty().withMessage('Es obligatorio')
        .custom(value => value >= 1? true : false).withMessage('Debe de ser positivo y mayor que 0'),
    check('release_date')
        .notEmpty().withMessage('Debe de indicar una fecha'),
    body('length')
        .notEmpty().withMessage('Es obligatorio')
        .custom(value => value >= 1? true : false).withMessage('Debe de ser positivo y mayor que 0')
]