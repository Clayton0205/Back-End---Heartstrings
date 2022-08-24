require('dotenv').config();
const db = require('./config/dbconnection')
const cors = require('cors')
const express = require('express')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
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
    res.sendFile(__dirname + '/views/home.html')
})


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

                jwt.sign(payload, process.env.jwtsecret, { expiresIn: "7d" }, (err, token) => {
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
            let generateSalt = await bcrypt.genSalt()
            body.Password = await bcrypt.hash(body.Password, generateSalt)

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
ALTER TABLE users AUTO_INCREMENT = 1;
`

    db.query(deleteUser, (err, results) => {
        if (err) throw err
        res.json({
            status: 204,
            msg: 'User Delete Successfully'
        })
    })
})
