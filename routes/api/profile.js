const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check } = require("express-validator");

// @route   GET api/profile/me 
// @desc    Get logged in user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name']);

        if(!profile){
            return res.status(400).json({msg: "There is no profile for this user"});
        }

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
});

// @route   POST api/profile/me 
// @desc    Create or update user profile
// @access  Private

router.post('/', [auth, [
    check('status', 'Status is required')
]] , (req, res) =>{})

module.exports = router;