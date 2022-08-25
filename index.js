require('dotenv').config();
const db = require('./config/dbconnection')
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const {hash} = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()
const router = express.Router()

app.set('Port', process.env.PORT)
app.use(express.static('view'))
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(router, cors(), express.json(), bodyParser.urlencoded({ extended: true }));

app.listen(app.get('Port'), () => { console.log(`Server is running on port ${app.get('Port')}`); })

app.get('/', (req, res) => {
    res.sendFile('/views/home.html', {root: __dirname})
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// All USERS
router.get('/users', (req, res) => {
    const getAll = `
        SELECT * FROM users
    `

    db.query(getAll, (err, results) => {
        if (err) throw err
        res.json({
            status: 200,
            users: results
        })
    })
})

// SINGLE USER
router.get('/users/:id', (req, res) => {
    const getSingle = `
        SELECT * FROM users WHERE userID = ${req.params.id}
    `

    db.query(getSingle, (err, results) => {
        if (err) throw err
        res.json({
            status: 200,
            user: results
        })
    })
})

//REGISTER
router.post('/users', bodyParser.json(), (req, res) => {
    const body = req.body
    const email = `
        SELECT * FROM users WHERE Email = ?
    `

    let emailReg = {
        Email: body.Email
    }
    db.query(email, emailReg, async (err, results) => {
        if (err) throw err
        if (results.length > 0) {
            res.json({
                status: 400,
                msg: 'The provided email already exists'
            })
        } else {
            // let generateSalt = await bcrypt.genSalt()
            body.Password = await hash(body.Password, 10);

            const add = `
                INSERT INTO users(Fullname, Email, Password)
                VALUES(?, ?, ?)
            `

            db.query(add, [body.Fullname, body.Email, body.Password], (err, results) => {
                if (err) throw err
                res.json({
                    status: 200,
                    msg: 'Registration Successful'
                })
            })
        }
    })
})

//LOGIN
router.patch('/users', bodyParser.json(), (req, res) => {
    const body = req.body
    const login = `
        SELECT * FROM users WHERE ?
    `

    let email = {
        Email: body.Email
    }
    db.query(login, email, async (err, results) => {
        if (err) throw err
        if (results.length === 0) {
            res.json({
                status: 400,
                msg: 'Email Not Found'
            })
        } else {
            if (await bcrypt.compare(body.Password, results[0].Password) == false) {
                res.json({
                    status: 404,
                    msg: 'Password is Incorrect'
                })
            } else {
                const payload = {
                    user: {
                        Fullname: results[0].Fullname,
                        Email: results[0].Email,
                        Password: results[0].Password,
                    }
                };

                jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: "7d" }, (err, token) => {
                    if (err) throw err
                    res.json({
                        status: 200,
                        user: results,
                        token: token
                    })
                })
            }
        }
    })
})



//EDIT USER
router.put('/users/:id', bodyParser.json(), async (req, res) => {
    const body = req.body
    const edit =
        `
    UPDATE users
    SET Fullname = ?, Email = ?, password = ?
    WHERE userID = ${req.params.id}
    `

    let generateSalt = await bcrypt.genSalt()
    body.Password = await bcrypt.hash(body.Password, generateSalt)
    db.query(edit, [body.Fullname, body.Email, body.Password], (err, results) => {
        if (err) throw err
        res.json({
            status: 204,
            msg: 'User has been edited succsessfully'
        })
    })
})

// DELETE USER
router.delete('/users/:id', (req, res) => {
    const deleteUser =
        `
     DELETE FROM users WHERE userID = ${req.params.id}; 
`

    db.query(deleteUser, (err, results) => {
        if (err) throw err
        res.json({
            status: 204,
            msg: 'User Delete Successfully'
        })
    })
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ALL ALBUMS
router.get('/albums', (req, res) => {
    const getAll =
        `
          SELECT * FROM albums
    `

    db.query(getAll, (err, results) => {
        if (err) throw err
        res.json({
            status: 200,
            album: results
        })
    })
})

//SINGLE ALBUM
router.get('/albums/:id', (req, res) => {
    const getSingle =
        `
    SELECT * FROM albums WHERE albumID = ${req.params.id}
    `

    db.query(getSingle, (err, results) => {
        if (err) throw err
        res.json({
            status: 200,
            album: results
        })
    })
})

// ADD ALBUM
router.post('/albums', bodyParser.json(), (req, res) => {
    const add =
        `
    INSERT INTO albums(musictype, album, image, description, artist, year, price, creatorID)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `

    db.query(add, [req.body.musictype, req.body.album, req.body.image, req.body.description, req.body.artist, req.body.year, req.body.price, req.body.creatorID], (err, results) => {
        if (err) throw err
        res.json({
            status: 204,
            msg: "Album added successfully"
        })
    })
})

//EDIT ALBUM
router.put('/albums/:id', bodyParser.json(), (req, res)=>{
    const editProdQ = `
        UPDATE albums
        SET musictype = ?, album = ?, image = ?, description = ?, artist = ?, year = ?, price = ?, creatorID = ?
        WHERE albumID = ${req.params.id}
    `

    db.query(editProdQ, [req.body.musictype, req.body.album, req.body.image, req.body.description, req.body.artist, req.body.year, req.body.price, req.body.creatorID], (err, results)=>{
        if (err) throw err
        res.json({
            status: 200,
            results: 'The album has been edited succesfully'
        })
    })
})

//DELETE ALBUM
router.delete('/albums/:id', (req, res) => {
    const deleteAlbum =
        `
    DELETE FROM albums WHERE albumID = ${req.params.id};
    `

    db.query(deleteAlbum, (err, results) => {
        if (err) throw err
        res.json({
            status: 204,
            msg: 'Album Delete Successfully'
        })
    })
})

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ALL CART
router.get('/users/:id/cart', (req, res)=>{
    const cartALL = `
        SELECT Cart FROM users 
        WHERE userID = ${req.params.id}
    `

    db.query(cartALL, (err, results)=>{
        if (err) throw err

        if (results[0].Cart !== null) {
            res.json({
                status: 200,
                cart: JSON.parse(results[0].Cart)
            }) 
        } else {
            res.json({
                status: 404,
                message: 'There is no items in your cart'
            })
        }
    })
})

// ADD TO CART
router.post('/users/:id/cart', bodyParser.json(),(req, res)=>{
    let bd = req.body
    const cartADD = `
        SELECT Cart FROM users 
        WHERE userID = ${req.params.id}
    `

    db.query(cartADD, (err, results)=>{
        if (err) throw err
        if (results.length > 0) {
            let cart;
            if (results[0].Cart == null) {
                cart = []
            } else {
                cart = JSON.parse(results[0].Cart)
            }
            let album = {
                "albumID" : cart.length + 1,
                "musictype" : bd.musictype,
                "album" : bd.album,
                "image" : bd.image,
                "description" : bd.description,
                "artist" : bd.artist,
                "year" : bd.year,
                "price": bd.price,
                "creatorID": bd.creatorID
            }
            cart.push(album);
            const query = `
                UPDATE users
                SET cart = ?
                WHERE userID = ${req.params.id}
            `

            db.query(query , JSON.stringify(cart), (err, results)=>{
                if (err) throw err
                res.json({
                    status: 200,
                    results: 'Product successfully added into cart'
                })
            })
        } else {
            res.json({
                status: 404,
                results: 'There is no user with that id'
            })
        }
    })
})

// DELETE ALL CART
router.delete('/users/:id/cart', (req,res)=>{
    const delALLCart = `
        SELECT Cart FROM users 
        WHERE userID = ${req.params.id}
    `
    db.query(delALLCart, (err,results)=>{
        if(err) throw err;
        if(results.length >0){
            const query = `
                UPDATE users 
                SET Cart = null 
                WHERE userID = ${req.params.id}
            `
            db.query(query,(err,results)=>{
                if(err) throw err
                res.json({
                    status:200,
                    results: `Successfully cleared the cart`
                })
            });
        }else{
            res.json({
                status:400,
                result: `There is no user with that ID`
            });
        }
    })
})

//DELETE SINGLE CART
router.delete('/users/:id/cart/:cartId', (req,res)=>{
        const delSingleCartProd = `
            SELECT Cart FROM users 
            WHERE userID = ${req.params.id}
        `
        db.query(delSingleCartProd, (err,results)=>{
            if(err) throw err;

            if(results.length > 0){
                // console.log(results)
                // console.log(JSON.parse(results[0].Cart))
                if(results[0].Cart != null){

                    const result = JSON.parse(results[0].Cart).filter((Cart)=>{
                        return Cart.albumID != req.params.cartId;
                    })
                    result.forEach((cart,i) => {
                        cart.albumID = i + 1
                    });
                    const query = `
                        UPDATE users 
                        SET cart = ? 
                        WHERE userID = ${req.params.id}
                    `;

                    db.query(query, [JSON.stringify(result)], (err,results)=>{
                        if(err) throw err;
                        res.json({
                            status:200,
                            result: "Successfully deleted the selected item from cart"
                        });
                    })

                }else{
                    res.json({
                        status:400,
                        result: "This user has an empty cart"
                    })
                }
            }else{
                res.json({
                    status:400,
                    result: "There is no user with that id"
                });
            }
        })

})