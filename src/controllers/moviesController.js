const path = require('path');
const fetch = require('node-fetch');
const db = require('../database/models');
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment')
const {validationResult} = require('express-validator');
const { error, count } = require('console');
const paginate = require('express-paginate')
const axios = require('axios');
const { url } = require('inspector');
const { response } = require('express');
const translatte = require('translatte')

//Aqui tienen una forma de llamar a cada uno de los modelos
// const {Movies,Genres,Actor} = require('../database/models');

//Aquí tienen otra forma de llamar a los modelos creados
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;

const URL_BASE = 'http://www.omdbapi.com/?apikey=ef2ac129';

const moviesController = {
    list: (req, res) => {

        
        const genres = db.Genre.findAll();
        const movies = db.Movie.findAndCountAll({
            include: ['genre'],
            limit:req.query.limit,
            offset:req.skip
        })
        
        Promise.all([genres, movies])
        .then(([genres,movies]) => {
            // res.send(movies)
            let {count, rows} = movies;
            // return res.send(rows)
            const pagesCount = Math.ceil(count/req.query.limit)
                res.render('moviesList.ejs', {
                    movies:rows, 
                    genres,
                    pages: paginate.getArrayPages(req)(pagesCount, pagesCount, req.query.page),
                    paginate,
                    pagesCount,
                    currentPages: req.query.page,
                    result:false,
                    resultApi:false
                })
            })
    },
    detail: (req, res) => {

        db.Movie.findByPk(req.params.id,{
            include: ['actors','genre']
        })
            .then(movie => {
                // return res.send(movie)
                res.render('moviesDetail.ejs', {...movie.dataValues, moment});
            });
    },
    new: (req, res) => {
        db.Movie.findAll({
            order : [
                ['release_date', 'DESC']
            ],
            limit: 5
        })
            .then(movies => {
                res.render('newestMovies', {movies});
            });
    },
    'recomended': (req, res) => {
        db.Movie.findAll({
            where: {
                rating: {[db.Sequelize.Op.gte] : 8}
            },
            order: [
                ['rating', 'DESC']
            ]
        })
            .then(movies => {
                res.render('recommendedMovies.ejs', {movies});
            });
    },
    search: (req,res) => {
        const keyword = req.query.title;
        db.Movie.findAll({
            where:{
                title:{
                    [Op.substring]:keyword
                }
            }
        })
        .then(movies => {

            if(!movies.length){
                axios.get(`${URL_BASE}&t=${keyword}`)
                    .then(async response =>{
                        // return res.send(response.data)
                        const {Title,Released,Genre,Awards,Poster,Ratings, Runtime  } = response.data;

                        const awardsArray = Awards.match(/\d+/g);
                        // return res.send(awardsArray)
                        const awardsParseado = awardsArray.map(award => +award)
                        const awards = awardsParseado.reduce((acum,num)=> acum + +num, 0)

                        const rating  = Ratings[0].Value.split('/')[0];        
                        const release_date = moment(Released).toDate();
                        const image = Poster;
                        const length = +Runtime.match(/\d+/g);
                        // return res.send(length)
                        const genres = await db.Genre.findAll();
                        const newGenre = Genre.split(',')[0];
                        let genre_id;

                        if(newGenre){

                            const {text} = await translatte(newGenre,{to:'es'})

                            const genres = await db.Genre.findAll({order:[['ranking','DESC']]});
                            
                            const [genre,genreCreated] = await db.Genre.findOrCreate({
                                where: {name:text},
                                defaults:{
                                    active:1,
                                    ranking:genres[0].ranking + 1
                                }
                            });
                            genre_id = genre.id

                        }

                        let newMovie = {
                            title:Title,
                            awards,
                            rating, 
                            release_date,
                            genre_id,
                            image,
                            length
                        }
                        // return res.send(newMovie);
                        db.Movie.create(newMovie)
                            .then(() => {
                                db.Movie.findAll({
                                    where:{
                                        title:{
                                            [Op.substring] : keyword
                                        }
                                    }
                                })
                                    .then(movies => {
                                        // return res.send(movies)
                                        return res.render('moviesList',{movies,genres,result:1,pages:false});
                                    })
                            })
                    })
                    .catch(error => console.log(error))
            } else{
                db.Genre.findAll()
                .then(genres => {
                    return res.render('moviesList',{movies, result:true, genres,pages:false})
                })
            }
            
        })
    },
    //Aqui dispongo las rutas para trabajar con el CRUD
    add: function (req, res) {
        const actors = db.Actor.findAll({
            order:[
                ['first_name','ASC'],
                ['last_name','ASC']
            ]
        });
        const genres = db.Genre.findAll({
            order: ['name']
        });
        Promise.all([actors,genres])
            .then(([actors, genres]) => {
                return res.render('moviesAdd',{
                    actors,
                    allGenres: genres
                })
            })
            .catch(error => console.log(error))
    },
    create: function (req,res) {
        const errors = validationResult(req);
        if(errors.isEmpty()){
            let {title, rating, release_date, awards, length, genre_id, actors} = req.body;
            actors = typeof actors === "string"? [actors] : actors;
            db.Movie.create({
                title:title.trim(), 
                rating, 
                release_date, 
                awards, 
                length,
                genre_id,
                image: req.file? req.file.filename :  null
            })
            .then(newMovie=>{
                if(actors){
                    let actorDB = actors.map(actor => {
                        return {
                            movie_id: newMovie.id,
                            actor_id: actor
                        }
                    })
                    // return res.send(actorDB);
                    db.Actor_Movie.bulkCreate(actorDB,{
                        validate: true
                    })
                    .then(()=>console.log('Actores agregados correctamente'))
                }
                console.log(newMovie)
                return res.redirect('/movies')
            })
            .catch(err => console.log(err))
        }else{
            // return res.send(errors)
            const actors = db.Actor.findAll();
            const genres = db.Genre.findAll({
                order: ['name']
            });
            Promise.all([actors, genres])
                .then(([actors, genres]) => {
                    // return res.send(req.body)
                    return res.render('moviesAdd',{
                        actors,
                        allGenres: genres,
                        errors: errors.mapped(),
                        old: req.body,
                    })
                })
                .catch(error => console.log(error))
        }
    },
    edit: function(req,res) {
        const genres = db.Genre.findAll({
            order:['name']
        });
        const movie = db.Movie.findByPk(req.params.id,{
            include:['actors']
        });
        const actors = db.Actor.findAll({
            order:[
                ['first_name','ASC'],
                ['last_name','ASC']
            ]
        });

        Promise.all([genres, movie, actors])
            .then(([genres,movie, actors]) => {
                // console.log(moment(movie.release_date).format('DD/MM/YYYY'))
                // return res.send(movie);
                return res.render('moviesEdit',{
                    allGenres: genres,
                    movie,
                    moment,
                    actors
                })
            })
            .catch(error => console.log(error))
    },
    update: function (req,res) {
        // return res.send(req.body)
        let errors = validationResult(req);
        if(errors.isEmpty()){
            let {title, rating, release_date, awards, length, genre_id, actors} = req.body;
            actors = typeof actors === "string"? [actors] : actors;
            // return res.send(req.body)
            db.Movie.update(
                {
                    title:title.trim(), 
                    rating, 
                    release_date, 
                    awards, 
                    length,
                    genre_id,
                    image : req.file? req.file.filename : null
                },
                {
                    where:{
                        id : req.params.id
                    }
                }
            )
            .then(() => {
                // return res.send(req.body)
                db.Actor_Movie.destroy({
                    where:{
                        movie_id : req.params.id
                    }
                })
                .then(()=>{
                    // return res.send(req.body)
                    if(actors){
                        let actorDB = actors.map(actor => {
                            return {
                                movie_id: req.params.id,
                                actor_id: actor
                            }
                        })
                        // return res.send(actorDB);
                        db.Actor_Movie.bulkCreate(actorDB,{
                            validate: true
                        })
                        .then(()=>console.log('Actores agregados correctamente'))
                    }
                })
            })
            .catch(error => console.log(error))
            .finally(()=>res.redirect('/movies'))
        } else{
            const genres = db.Genre.findAll({
                order:['name']
            })
            const movie = db.Movie.findByPk(req.params.id)

            Promise.all([genres, movie])
                .then(([genres,movie]) => {
                    return res.render('moviesEdit',{
                        errors: errors.mapped(),
                        old: req.body,
                        movie:movie,
                        allGenres: genres
                    })
                })
        }
    },
    delete: function (req,res) {

    },
    destroy: function (req,res) {

        db.Actor_Movie.destroy({
            where:{
                movie_id: req.params.id
            }
        })
        .then(()=>{
            db.Actor.update(
                {
                    favorite_movie_id: null
                },
                {
                    where:{
                        favorite_movie_id: req.params.id
                    }
                }
            )
            .then(() => {
                db.Movie.destroy({
                    where:{
                        id:req.params.id
                    }
                })
                .then(()=>{
                    return res.redirect('/movies')
                })
            })
        })
        .catch(error => console.log(error))

        
    }
}

module.exports = moviesController;