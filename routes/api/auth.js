const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config')

const User = require('../../models/User');

// @route   GET api/auth
// @desc    TEST route
// @access  Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(err.message);
        res.status(500).send('Server Error');
        
    }
});
 
// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  Public
router.post('/',[
    check('email', 'Please include a valid email addess').isEmail(),
    check('password', 'Password exists').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const {email, password} = req.body;

    try {
        let user = await User.findOne({email});

        if(!user){
            return res.status(400).json({errors: [{msg:'Invalid Credentials'}]})
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
            return res.status(400).json({errors: [{msg:'Invalid Credentials'}]})
        }

        const payload = {
            user:{
                id: user.id
            }
        }

        jwt.sign(payload, config.get('jwtSecret'), {expiresIn: 360000000}, (err, token) => {
            if(err) throw err;
            res.json({ token, id: user.id, username: user.username, name: user.name });
        })

    } catch (error) {
        console.error(error.message);
        res.status(500).send('')
    }

});

module.exports = router;