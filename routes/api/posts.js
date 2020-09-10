const express = require('express')
const request = require('request')
const router = express.Router()
const auth = require('../../middleware/auth')
const { body, validationResult } = require('express-validator')

const Post = require('../../models/Post')
const User = require('../../models/User')
const Profile = require('../../models/Profile')

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [auth, [body('text', 'Post text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = await User.findById(req.user.id).select('-password')

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      })

      const post = await newPost.save()

      res.json(post)
    } catch (err) {
      console.error(err)
      res.status(500).send('Server error')
    }
  }
)

// @route   GET api/posts
// @desc    Get all posts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ data: -1 })
    res.json(posts)
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Server Error')
  }
})

// @route   GET api/posts/:post_id
// @desc    Get a post by id
// @access  Private
router.get('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' })
    }
    res.json(post)
  } catch (err) {
    console.error(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found.' })
    }
    res.status(500).send('Server Error')
  }
})

// @route   DELETE api/posts/:post_id
// @desc    Delete a post by id
// @access  Private
router.delete('/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' })
    }

    // Ensure user deleting post is the user who created the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' })
    }

    await post.remove()

    res.json({ message: 'Post removed.' })
  } catch (err) {
    console.error(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found.' })
    }
    res.status(500).send('Server Error')
  }
})

// @route   PUT api/posts/like/:post_id
// @desc    Like a post
// @access  Private
router.put('/like/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)

    // Check if post exists
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Check if post already been liked by current user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ message: 'Post already liked' })
    }

    post.likes.unshift({ user: req.user.id })

    await post.save()

    res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' })
    }
    res.status(500).send('Server Error')
  }
})

// @route   PUT api/posts/unlike/:post_id
// @desc    unlike a post
// @access  Private
router.put('/unlike/:post_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)

    // Check if post exists
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Check if post already been liked by current user
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ message: 'Post has not yet been liked' })
    }

    // Get the remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id)

    post.likes.splice(removeIndex, 1)

    await post.save()

    res.json(post.likes)
  } catch (err) {
    console.error(err.message)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' })
    }
    res.status(500).send('Server Error')
  }
})

// @route   POST api/posts/comment/:post_id
// @desc    Comment on a post
// @access  Private
router.post(
  '/comment/:post_id',
  [auth, [body('text', 'Post text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const user = await User.findById(req.user.id).select('-password')
      const post = await Post.findById(req.params.post_id)

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      }

      post.comments.unshift(newComment)

      await post.save()

      res.json(post.comments)
    } catch (err) {
      console.error(err)
      res.status(500).send('Server error')
    }
  }
)

// @route   DELETE api/posts/comment/:post_id/:comment_id
// @desc    Remove comment on a post
// @access  Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id)
    // Get comment from post
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    )

    // make sure comment exists
    if (!comment) {
      res.status(404).json({ message: 'Comment does not exist' })
    }

    // Check user deleting comment is user that posted that comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' })
    }

    // Get the remove index
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id)

    post.comments.splice(removeIndex, 1)

    await post.save()
    res.json(post.comments)
  } catch (err) {
    console.error(err)
    res.status(500).send('Server Error.')
  }
})

module.exports = router
