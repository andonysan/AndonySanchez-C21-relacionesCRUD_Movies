const express = require('express');
const router = express.Router();
const {add, create, edit, update, delete:remove, destroy, list, new:newest, recomended, detail} = require('../controllers/moviesController');
const movieAddValidations = require('../validations/movieAddValidations');
const movieEditValidator = require('../validations/movieEditValidator');
const upload = require('../middlewares/upload');

router.get('/movies', list)
    .get('/movies/new', newest)
    .get('/movies/recommended', recomended)
    .get('/movies/detail/:id', detail)
    //Rutas exigidas para la creación del CRUD
    .get('/movies/add', add)
    .post('/movies/create', upload.single('image'),movieAddValidations,create)
    .get('/movies/edit/:id', edit)
    .put('/movies/update/:id', movieEditValidator,update)
    .get('/movies/delete/:id', remove)
    .delete('/movies/delete/:id', destroy);

module.exports = router;