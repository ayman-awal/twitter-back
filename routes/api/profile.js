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

        const isBookmarked = profile.bookmarks.some(bookmark => bookmark.post.toString() === req.params.id);

        if(isBookmarked){
            return res.status(400).json({msg: 'Post already bookmarked'});
        }

        profile.bookmarks.unshift({post: req.params.id});

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

        if(profile.bookmarks.length < 1){
            return res.status(400).json({msg: 'Bookmarks list is empty, cannot remove bookmark'});
        }

        const isBookmarked = profile.bookmarks.some(bookmark => bookmark.post.toString() === req.params.id);

        if(!isBookmarked){
            return res.status(400).json({msg: 'Post not bookmarked yet'});
        }

        const removeIndex = profile.bookmarks.map(bookmark => bookmark.post.toString()).indexOf(req.params.id);

        profile.bookmarks.splice(removeIndex, 1);

        await profile.save();
        await post.save();

        const postArray = profile.bookmarks.map(bookmark => bookmark.post);
        res.status(200).json(postArray);

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

        let followingList = loggedInUser.following;
        const isFollowing = followingList.some(User => User.user.toString() === req.params.id);

        if(isFollowing){
            return res.status(400).json({msg: 'Already following this user'});
        } 
        
        followingList.unshift({user: req.params.id});
        user.followers.unshift({user: req.user.id});

        await loggedInUser.save();
        await user.save();
        
        res.status(200).json({following: loggedInUser.following, followers: loggedInUser.followers});
        
        
    } catch (error) {
        res.status(500).send('Server Error');
    }
})


// @route   PUT api/profile/unfollow/:id
// @desc    Unfollow user
// @access  Private

router.put("/unfollow/:id", auth, async(req, res) => {
    try {
        const loggedInUser = await Profile.findOne({user: req.user.id});
        const user = await Profile.findOne({user: req.params.id});

        const isFollowing = loggedInUser.following.some(User => User.user.toString() === req.params.id);

        if(!isFollowing){
            return res.status(400).json({msg: 'Logged in user is not following this user'});
        } 

        loggedInUser.following = loggedInUser.following.filter(follower => follower.user.toString() !== req.params.id);
        user.followers = user.followers.filter(follower => follower.user.toString() !== req.user.id);

        await loggedInUser.save();
        await user.save();

        res.status(200).json({following: loggedInUser.following, followers: loggedInUser.followers});

    } catch (error) {
        res.status(500).send('Server Error');
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

// @route   GET api/profile/following/:username
// @desc    Get following by username
// @access  Private

router.get("/following/:username", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({username: req.params.username});

        if (!profile){
            return res.json({msg: 'Profile does not exist'});
        }

        res.json(profile.following);

    } catch (error) {
        res.status(500).send('Server Error');
    }
})

// @route   GET api/profile/followers/:username
// @desc    Get followers by username
// @access  Private

router.get("/followers/:username", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({username: req.params.username});

        if (!profile){
            return res.json({msg: 'Profile does not exist'});
        }

        res.json(profile.followers);

    } catch (error) {
        res.status(500).send('Server Error');
    }
})





module.exports = router;