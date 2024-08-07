const express = require("express");
const router = express.Router();
const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const { check, validationResult } = require("express-validator");

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

// @route   POST api/profile
// @desc    Create or update user profile
// @access  Private

router.post('/', auth, async (req, res) =>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }

    const {
        website,
        location,
        status,
        bio
    } = req.body;

    const profileFields = {};

    profileFields.user = req.user.id;

    if(website) profileFields.website = website;
    if(location) profileFields.location = location;
    if(status) profileFields.status = status;
    if(bio) profileFields.bio = bio;

    try {
        let profile = await Profile.findOne({user: req.user.id});
        let user = await User.findOne({_id: req.user.id});
        let posts = await Post.find({ user: req.user.id });

        if(profile){
            profile = await Profile.findOneAndUpdate({user: req.user.id}, {$set: profileFields}, {new: true});
            return res.json(profile);
        }

        profileFields.posts = posts;
        profile = new Profile(profileFields);
        profile.username = user.username;
        profile.name = user.name;
        await profile.save();
        
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
})


// @route   GET api/profile
// @desc    Get all profiles
// @access  Public

router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public

router.get("/user/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.params.user_id}).populate('user', ['name']);

        if(!profile){
            return res.status(400).json({msg: 'Profile not found'});
        }

        res.json(profile);

    } catch (error) {
        console.error(error.message);
        if(error.kind == 'ObjectId'){
            return res.status(400).json({msg: 'Profile not found'});
        }
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/profile
// @desc    Get profile by user ID
// @access  Private

router.delete("/", auth, async (req, res) => {
    try {
        await Profile.findOneAndDelete({ user: req.user.id })
        await User.findOneAndDelete({ _id: req.user.id })
    
        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

// @route   PUT api/profile/bookmark/add/:post_id
// @desc    Add bookmark
// @access  Private

router.put("/bookmark/add/:id", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name']);

        if (!profile){
            return res.status(400).json({msg: "There is no profile for this user"});
        }

        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(400).json({msg: "There is no profile for this user"});
        }

        // if(profile.bookmarks.filter(bookmark => bookmark.post.toString() === req.params.id)){
        //     return res.status(400).json({msg: 'Post already bookmarked'});
        // }

        profile.bookmarks.unshift({post: req.params.id});
        post.bookmarked = true;

        await profile.save();
        await post.save();

        // res.json(profile.bookmarks);
        const postArray = profile.bookmarks.map(bookmark => bookmark.post);
        res.json(postArray);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/bookmark/remove/:post_id
// @desc    Remove bookmark
// @access  Private

router.put('/bookmark/remove/:id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name']);

        if (!profile){
            return res.status(400).json({msg: "There is no profile for this user"});
        }

        const post = await Post.findById(req.params.id);

        if(!post){
            return res.status(400).json({msg: "There is no profile for this user"});
        }

        if(profile.bookmarks.filter(bookmark => bookmark.post.toString() === req.params.id).length == 0){
            return res.status(400).json({msg: 'Post not bookmarked yet'});
        }

        const removeIndex = profile.bookmarks.map(bookmark => bookmark.post.toString()).indexOf(req.params.id);

        profile.bookmarks.splice(removeIndex, 1);
        post.bookmarked = false;

        await profile.save();
        await post.save();

        // res.json(profile.bookmarks);

        const postArray = profile.bookmarks.map(bookmark => bookmark.post);
        res.json(postArray);

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/profile/bookmarks/me
// @desc    Get all bookmarks
// @access  Private

router.get("/bookmarks/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({user: req.user.id}).populate('user', ['name']);

        if (!profile){
            return res.status(400).json({msg: "There is no profile for this user"});
        }

        const postArray = profile.bookmarks.map(bookmark => bookmark.post);
        res.json(postArray);

        // let postArray = [];

        // for(let i; i < profile.bookmarks.length; i++){
        //     postArray.push(profile.bookmarks[i].post);
        // }

        // res.json(postArray);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/profile/follow/:id
// @desc    Follow user
// @access  Private

router.put("/follow/:id", auth, async(req, res) => {
    try {
        const loggedInUser = await Profile.findOne({user: req.user.id});
        const user = await Profile.findOne({user: req.params.id});

        // if(loggedInUser.following.filter(follow => follow.user.toString() === user.id)){
        //     return res.status(400).json({msg: 'Already following this user'});
        // }

        loggedInUser.following.unshift({user: user.id});
        user.followers.unshift({user: loggedInUser.id});

        await loggedInUser.save();
        await user.save();
        
        res.json(user);

    } catch (error) {
        
    }
})

// @route   PUT api/profile/username
// @desc    get profile by username
// @access  Private

router.get("/:username", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({username: req.params.username});

        if(profile){
            return res.json(profile);
        }

        res.json({msg: "Profile with that username does not exist"});

    } catch (error) {
        
    }
})

// @route   PUT api/profile/unfollow/
// @desc    Follow user
// @access  Private

// router.put("/follow/:id", auth, async(req, res) => {
//     try {
//         const loggedInUser = await Profile.findOne({user: req.user.id});
//         const user = await Profile.findOne({user: req.params.id});

//         // if(loggedInUser.following.filter(follow => follow.user.toString() === user.id)){
//         //     return res.status(400).json({msg: 'Already following this user'});
//         // }

//         loggedInUser.following.unshift({user: user.id});
//         user.followers.unshift({user: loggedInUser.id});

//         await loggedInUser.save();
//         await user.save();
        
//         res.json(user);

//     } catch (error) {
        
//     }
// })



module.exports = router;