const likesService = require("../services/likes.service");
const postsService = require("../services/posts.service");
const usersService = require("../services/users.service");

// GET /posts/:id/likes - Who liked this post
async function list(req, res) {
  try {
    const postId = parseInt(req.params.id, 10);

    const exists = await postsService.postExists(postId);
    if (!exists) {
      return res.status(404).json({ error: "Post not found" });
    }

    const users = await likesService.listPostLikers(postId);
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// POST /posts/:id/likes - Like a post
async function create(req, res) {
  try {
    const postId = parseInt(req.params.id, 10);
    const { userId } = req.body;

    if (userId === undefined || userId === null) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Order matters: body first, then the post, then the user
    const postFound = await postsService.postExists(postId);
    if (!postFound) {
      return res.status(404).json({ error: "Post not found" });
    }

    const user = await usersService.getUserById(Number(userId));
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const like = await likesService.createLike(Number(userId), postId);
    return res.status(201).json(like);
  } catch (error) {
    // The composite primary key rejects a second like. Catching it instead of
    // checking first means two simultaneous requests can't both slip through.
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  list,
  create
};
