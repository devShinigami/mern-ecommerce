export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
  console.log(user);
  res.status(statusCode).json({
    success: true,
    user,
    token,
  });
};
