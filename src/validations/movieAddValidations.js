const {check} = require('express-validator')

module.exports = [
    check('title')
        .notEmpty().withMessage('Es obligatorio')
        .isLength({
            min: 4,
            max: 50
        }).withMessage('Debe de tener entre 5 y 50 caracteres'),
    check('rating')
        .notEmpty().withMessage('Es obligatorio')
        .isInt({
            gt:1
        }).withMessage('Debe de ser positivo'),
    check('awards')
        .notEmpty().withMessage('Es obligatorio')
        .isInt({
            gt:1
        }).withMessage('Debe de ser positivo'),
    check('release_date')
        .notEmpty().withMessage('Debe de indicar una fecha'),
    check('length')
        .notEmpty().withMessage('Es obligatorio')
        .isInt({
            gt:1
        }).withMessage('Debe de ser positivo'),
    check('genre_id')
        .notEmpty().withMessage('Es obligatorio')
]