const Post = require('../models/Post');

// Reading time calculator
const getReadingTime = (text) => {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.ceil(words / 200);
  return `${mins} min read`;
};

// ── Create Post ────────────────────────────────────────────
exports.createPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }

    const post = await Post.create({
      title,
      content,
      tags: tags || [],
      author: req.user.id,
    });

    await post.populate('author', 'name email');

    res.status(201).json({ success: true, message: 'Post published!', post });
  } catch (err) {
    console.error('Create post error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: 'Failed to create post.' });
  }
};

// ── Get All Posts ──────────────────────────────────────────
exports.getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = search
      ? { $or: [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }] }
      : {};

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Post.countDocuments(query),
    ]);

    const postsWithMeta = posts.map(post => ({
      ...post.toObject(),
      readingTime: getReadingTime(post.content),
      preview: post.content.slice(0, 180) + (post.content.length > 180 ? '...' : ''),
    }));

    res.status(200).json({
      success: true,
      posts: postsWithMeta,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts.' });
  }
};

// ── Get Single Post ────────────────────────────────────────
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email bio');
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    res.status(200).json({
      success: true,
      post: {
        ...post.toObject(),
        readingTime: getReadingTime(post.content),
      },
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch post.' });
  }
};

// ── Update Post ────────────────────────────────────────────
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts.' });
    }

    const { title, content, tags } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags !== undefined) post.tags = tags;

    await post.save();
    await post.populate('author', 'name email');

    res.status(200).json({ success: true, message: 'Post updated!', post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update post.' });
  }
};

// ── Delete Post ────────────────────────────────────────────
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts.' });
    }

    await post.deleteOne();
    res.status(200).json({ success: true, message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete post.' });
  }
};

// ── My Posts ───────────────────────────────────────────────
exports.getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    const postsWithMeta = posts.map(post => ({
      ...post.toObject(),
      readingTime: getReadingTime(post.content),
      preview: post.content.slice(0, 180) + (post.content.length > 180 ? '...' : ''),
    }));

    res.status(200).json({ success: true, posts: postsWithMeta });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch your posts.' });
  }
};
