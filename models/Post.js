const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    text: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    username:{
        type: String
    },
    likes: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        }
    ],
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            },
            text:{
                type: String,
                require: true
            },
            name:{
                type: String
            },
            date:{
                type: Date,
                default: Date.now
            }
        }
    ],
    bookmarked: {
        type: Boolean,
        default: false
    },
    date:{
        type: Date,
        default: Date.now
    }
});

module.exports = Post = mongoose.model('post', PostSchema);