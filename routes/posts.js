const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
  getMyPosts,
} = require('../controllers/postController');
const { auth } = require('../middleware/auth');

router.get('/', getAllPosts);
router.get('/my', auth, getMyPosts);
router.get('/:id', getPost);
router.post('/', auth, createPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);

module.exports = router;
