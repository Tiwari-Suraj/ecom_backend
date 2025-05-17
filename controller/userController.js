const crypto = require("crypto");
const userModel = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/sendToken");
const catchAsyncError = require("../middleware/catchAsyncError");
const { sendMails } = require("../utils/sendEmail");

//  //! Create New User...
exports.newUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Fileds can't be empty", 400));
  }
  const userExist = await userModel.findOne({ email:String(email).toLowerCase() });
  if (userExist) {
    return next(new ErrorHandler(`${email} is already used`, 400));
  }
  const newUser = await userModel.create({
    name,
    email:String(email).toLowerCase(),
    password,
  });
  sendToken(newUser, "Account created", 201, res);
});

//  //! Login User...
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Fields can't be empty", 400));
  }
  const findUser = await userModel.findOne({ email:String(email).toLowerCase() }).select("+password");
  if (!findUser) {
    return next(new ErrorHandler(`Invalid Email or Password`, 401));
  }
  const checkAuthentication = await findUser.comparePassword(password);
  if (!checkAuthentication) {
    return next(new ErrorHandler("Invalid Email or Password", 401));
  }
  if(findUser.status!=='Active')
    return next(new ErrorHandler(`Your account has been hold.`, 401));
  
  sendToken(findUser, "Logged In", 200, res);
});

//  //! Logout...
exports.logout = catchAsyncError(async (req, res, next) => {
  res.cookie("userToken", null, {
    expires: new Date(Date.now()),
    httponly: true,
  });
  return res.status(200).json({ success: true, message: "Logout" });
});

//  //! Reset Password Token through Email...
exports.forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.params;
  if (!email) {
    return next(new ErrorHandler("Email is required.", 400));
  }
  const findUser = await userModel.findOne({ email:String(email).toLowerCase() });
  if (!findUser) {
    return next(new ErrorHandler(`${email} not found.`, 400));
  }
  const getResetToken = await findUser.getResetPasswordToken();

  //  //? Remove token from DB after 15 min (900000 ms)...
  setTimeout(async () => {
    findUser.resetPasswordToken = undefined;
    findUser.tokenExpireTime = undefined;
    await findUser.save({ validateBeforeSave: false });
  },900000);

  await findUser.save({ validateBeforeSave: false });
  const restPasswordURL = `https://storedark.netlify.app/user/password/reset/${getResetToken}`;
  const subject = "Password Recovery Link";
  const message = `<div style="background-color:gray;padding:10px 10px;color:white;border:2px solid gray;border-radius:5%">
                    <h3>We have received a requet to reset your <a href="https://storedark.netlify.app/" style="text-decoration:none;color:white">Dark Store</a> password</h1>
                    <p>You can reset your password by clicking on <a href="${restPasswordURL}" style="color:orange">update password</a> 🤫
                      <span style="">It will expire in 15 minutes.</span>
                    </p>
                    <p>If you're not requested then ignore it.</p>
                    <p style="margin-top:50px"><span style="margin-right:50px">Regards,</span><br/>Team <a href="https://storedark.netlify.app/" style="color:white">Dark Store</a></p>
                  </div>`;

  try {
    //  //? Send mail to the user mail...
    await sendMails({ email:String(email).toLowerCase(), subject, message });
    return res.status(200).json({
      success: true,
      message: `A mail sent to ${email} successfully.`,
      message
    });
  } catch (err) {
    findUser.resetPasswordToken = undefined;
    findUser.tokenExpireTime = undefined;
    await findUser.save({ validateBeforeSave: false });
    return next(new ErrorHandler(err.message, 500));
  }
});

//  //! Reset the Password...
exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const { token } = req.params;
  if (!password || !confirmPassword) {
    return next(new ErrorHandler("Password required", 400));
  }
  if (password !== confirmPassword) {
    return next(
      new ErrorHandler("Password & Confirm Password mis-matched", 400)
    );
  }
  if (password.length < 8 || confirmPassword.length < 8) {
    return next(new ErrorHandler("Password must be 8 char long.", 400));
  }
  //  //? Hash the token, which will come from params & then find it in DB...
  const hashedToken = await crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const findUser = await userModel.findOne({
    resetPasswordToken: hashedToken,
    tokenExpireTime: { $gt: Date.now() } ,
  });

  if (!findUser) {
    return next(
      new ErrorHandler("Reset Password token is expired or invalid.", 400)
    );
  }
  findUser.password = password;
  findUser.resetPasswordToken = undefined;
  findUser.tokenExpireTime = undefined;
  await findUser.save({ validateBeforeSave: true });
  sendToken(findUser, "Password updated.", 200, res);
});

//  //! Get User [Me]...
exports.getUserDetails = catchAsyncError(async (req, res, next) => {
  const user = await req.user;
  return res.status(200).json({ success: true, user });
});

//  //! Update Password...
exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("Fields can't be empty", 400));
  }
  if (newPassword !== confirmPassword) {
    return next(
      new ErrorHandler("New password & Confirm password Mis-Matched", 400)
    );
  }
  if (newPassword.length < 8 || confirmPassword.length < 8) {
    return next(new ErrorHandler("Password must be 8 char long.", 400));
  }

  const findUser = await userModel.findById(req.user.id).select("+password");
  const isOldPasswordValid = await findUser.comparePassword(oldPassword);
  if (!isOldPasswordValid) {
    return next(new ErrorHandler("Old password is Invalid", 401));
  }
  findUser.password = confirmPassword;
  findUser.save({ validateBeforeSave: true });
  sendToken(findUser, "Password Updated", 200, res);
});

//  //! Upload or Update Profile Picture...
exports.uploadProfilePicture = catchAsyncError(async (req, res, next) => {
  const user = await req.user;
  const { mimetype, buffer, size } = req.file;
  if(!String(mimetype).match("image")){
    return res.status(401).json({success:false,message:"Please select valid file"});
  }
  if (size > 1048576) {     //  1048576 KB  == 1 MB
    return res
      .status(401)
      .json({ success: false, message: "Image size must be less than 1 MB" });
  }
  await userModel.findByIdAndUpdate(user.id, {
    profilePicture: { data: buffer, contentType: mimetype },
  });
  const userData = await userModel.findById(user.id);
  return res
    .status(200)
    .json({ success: true, message: "Picture Upload", userData });
});
