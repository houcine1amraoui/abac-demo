import jwt from "jsonwebtoken";

// token-based authentication
export function isAuthenticated(req, res, next) {
  const cookies = req.cookies;
  if (!cookies) {
    return res.status(401).send("Unauthenticated");
  }
  const accessToken = cookies.accessToken;
  if (!accessToken) {
    return res.send("Invalid Token");
  }

  try {
    const user = jwt.verify(accessToken, process.env.TOKEN_SECRET);
    req.user = user;
    next();
  } catch (error) {
    return res.json(error.message);
  }
}
