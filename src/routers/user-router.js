import { Router } from 'express';
import is from '@sindresorhus/is';
import bcrypt from 'bcrypt';
import { upload } from '../utils';
// 폴더에서 import하면, 자동으로 폴더의 index.js에서 가져옴
//loginRequired : 로그인 여부&&토큰 여부
//adminRequired : 토큰에서 role이 admin인지 판별
//tokenMatchRequest : 토큰의 userid와 req의 userid와 비교
import { loginRequired } from '../middlewares';
import { adminRequired } from '../middlewares';
import { tokenMatchRequest } from '../middlewares';
import { userService } from '../services';
import { asyncHandler } from '../middlewares';

import { generateRandomPassword } from '../utils/generate-Random-Password';
import { sendChangePassword } from '../utils/sendMail'

const userRouter = Router();

// 회원가입 api (아래는 /register이지만, 실제로는 /api/register로 요청해야 함.)
userRouter.post('/register', asyncHandler(async (req, res, next) => {

    // Content-Type: application/json 설정을 안 한 경우, 에러를 만들도록 함.
    // application/json 설정을 프론트에서 안 하면, body가 비어 있게 됨.
    if (is.emptyObject(req.body)) {
      throw new Error(
        'headers의 Content-Type을 application/json으로 설정해주세요'
      );
    }

    // req (request)의 body 에서 데이터 가져오기
    const fullName = req.body.fullName;
    const email = req.body.email;
    const password = req.body.password;

    // 위 데이터를 유저 db에 추가하기
    const newUser = await userService.addUser({
      fullName,
      email,
      password,
    });

    // 추가된 유저의 db 데이터를 프론트에 다시 보내줌
    // 물론 프론트에서 안 쓸 수도 있지만, 편의상 일단 보내 줌
    res.status(201).json(newUser);

}));

// 로그인 api (아래는 /login 이지만, 실제로는 /api/login로 요청해야 함.)
userRouter.post('/login', asyncHandler(async (req, res, next)=> {
 
    // application/json 설정을 프론트에서 안 하면, body가 비어 있게 됨.
    if (is.emptyObject(req.body)) {
      throw new Error(
        'headers의 Content-Type을 application/json으로 설정해주세요'
      );
    }

    // req (request) 에서 데이터 가져오기
    const email = req.body.email;
    const password = req.body.password;

    // 로그인 진행 (로그인 성공 시 jwt 토큰을 프론트에 보내 줌)
    const userTokenAndInfo = await userService.getUserToken({
      email,
      password,
    });

    // jwt 토큰과 유저정보을 프론트에 보냄 (jwt 토큰은, 문자열임)
    res.status(200).json(userTokenAndInfo);

}));

// 관리자 유저리스트를 가져옴 (배열 형태임) - 페이지네이션/검색기능
// 미들웨어로 loginRequired 를 썼음 (이로써, jwt 토큰이 없으면 사용 불가한 라우팅이 됨)
userRouter.get(
  '/admin/userlist',
  loginRequired,
  adminRequired,
  asyncHandler(async (req, res, next)=> {
    //pagination 변수
    //page : 현재 페이지
    //perPage : 페이지 당 게시글개수
    const page = Number(req.query.page || 1);
    const perPage = Number(req.query.perPage || 10);

    //동적 쿼리 적용
    // option 유저 목록 검색 기능
    let searchOptions = {};
    if (req.query.option == 'email') {
      searchOptions = { email: req.query.content };
    } else if (req.query.option == 'fullName') {
      searchOptions = { fullName: req.query.content };
    } else if (req.query.option == 'role') {
      searchOptions = { role: req.query.content };
    } else if (req.query.option == 'phoneNumber') {
      searchOptions = { phoneNumber: req.query.content };
    }


      // 전체 사용자 목록을 얻음
      const totalUsers = await userService.countTotalUsers();
      const users = await userService.getUsers(page, perPage, searchOptions);

      const totalPage = Math.ceil(totalUsers / perPage);

      // 사용자 목록(배열)을 JSON 형태로 프론트에 보냄
      res.status(200).json({
        searchOptions,
        users,
        page,
        perPage,
        totalPage,
        totalUsers,
      });
    
}));

// 관리자가 사용자 role부여 수정
// (예를 들어 /api/admin/users/abc12345 로 요청하면 req.params.userId는 'abc12345' 문자열로 됨)
userRouter.patch(
  '/admin/users/:userId',
  loginRequired,
  adminRequired,
  asyncHandler(async (req, res, next)=> {
  
      // content-type 을 application/json 로 프론트에서
      // 설정 안 하고 요청하면, body가 비어 있게 됨.
      if (is.emptyObject(req.body)) {
        throw new Error(
          'headers의 Content-Type을 application/json으로 설정해주세요'
        );
      }

      // params로부터 id를 가져옴
      const userId = req.params.userId;

      // body data 로부터 업데이트할 사용자 정보를 추출함.
      const role = req.body.role;

      // 위 데이터가 undefined가 아니라면, 즉, 프론트에서 업데이트를 위해
      // 보내주었다면, 업데이트용 객체에 삽입함.
      const toUpdate = {
        ...(role && { role }),
      };

      // 사용자 정보를 업데이트함.
      const updatedUserInfo = await userService.adminGrantUserRole(
        userId,
        toUpdate
      );

      // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
      res.status(200).json(updatedUserInfo);

  }
));

// 사용자 정보 조회
// (예를 들어 /api/users/abc12345 로 요청하면 req.params.userId는 'abc12345' 문자열로 됨)
userRouter.get(
  '/users/:userId',
  loginRequired,
  tokenMatchRequest,
  asyncHandler(async (req, res, next)=> {
    
      // params로부터 id를 가져옴
      const userId = req.params.userId;

      // 사용자 정보를 업데이트함.
      const findUserInfo = await userService.getUser(userId);

      // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
      res.status(200).json(findUserInfo);

  }
));

// 사용자 정보 조회
// (예를 들어 /api/users/abc12345 로 요청하면 req.params.userId는 'abc12345' 문자열로 됨)
userRouter.get(
  '/admin/users/:userId',
  loginRequired,
  adminRequired,
  asyncHandler(async (req, res, next)=> {
      // params로부터 id를 가져옴
      const userId = req.params.userId;

      // 사용자 정보를 업데이트함.
      const findUserInfo = await userService.getUser(userId);

      // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
      res.status(200).json(findUserInfo);
  }
));

// 사용자 정보 수정
// (예를 들어 /api/users/abc12345 로 요청하면 req.params.userId는 'abc12345' 문자열로 됨)
userRouter.patch(
  '/users/:userId',
  loginRequired,
  tokenMatchRequest,
  upload.single('image'),
  asyncHandler(async (req, res, next)=> {

      // content-type 을 application/json 로 프론트에서
      // 설정 안 하고 요청하면, body가 비어 있게 됨.
      let newImage = "none";
      if (req.file) {
        newImage = req.file.location;
      } else {
      if (is.emptyObject(req.body)) {
        throw new Error(
          'headers의 Content-Type을 application/json으로 설정해주세요'
        );
       }
      }

      // params로부터 id를 가져옴
      const userId = req.params.userId;

      // body data 로부터 업데이트할 사용자 정보를 추출함.
      const fullName = req.body.fullName;
      const password = req.body.password;
      const postalCode = req.body.postalCode;
      const address1 = req.body.address1;
      const address2 = req.body.address2;
      const address = {postalCode, address1, address2};
      const phoneNumber = req.body.phoneNumber;
      const role = req.body.role;
      // body data로부터, 확인용으로 사용할 현재 비밀번호를 추출함.
      const currentPassword = req.body.currentPassword;
      let { image } = req.body;

      if (newImage !== "none") {
        image = newImage
      }
      console.log(address,password, currentPassword);

      // currentPassword 없을 시, 진행 불가
      if (!currentPassword) {
        throw new Error('정보를 변경하려면, 현재의 비밀번호가 필요합니다.');
      }

      const userInfoRequired = { userId, currentPassword };

      // 위 데이터가 undefined가 아니라면, 즉, 프론트에서 업데이트를 위해
      // 보내주었다면, 업데이트용 객체에 삽입함.
      const toUpdate = {
        ...(fullName && { fullName }),
        ...(password && { password }),
        ...(address && { address }),
        ...(phoneNumber && { phoneNumber }),
        ...(role && { role }),
        ...(image && { image }),
      };

      // 사용자 정보를 업데이트함.
      const updatedUserInfo = await userService.setUser(
        userInfoRequired,
        toUpdate
      );

      // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
      res.status(200).json(updatedUserInfo);

  }
));

// 사용자 정보 삭제
// (예를 들어 /api/users/abc12345 로 요청하면 req.params.userId는 'abc12345' 문자열로 됨)
userRouter.delete(
  '/users/:userId',
  loginRequired,
  tokenMatchRequest,
  asyncHandler(async (req, res, next)=> {
    
      // content-type 을 application/json 로 프론트에서
      // 설정 안 하고 요청하면, body가 비어 있게 됨.
      if (is.emptyObject(req.body)) {
        throw new Error(
          'headers의 Content-Type을 application/json으로 설정해주세요'
        );
      }

      // params로부터 id를 가져옴
      const userId = req.params.userId;

      // body data로부터, 확인용으로 사용할 현재 비밀번호를 추출함.
      const currentPassword = req.body.currentPassword;

      // currentPassword 없을 시, 진행 불가
      if (!currentPassword) {
        throw new Error('회원을 탈퇴할려면, 현재의 비밀번호가 필요합니다.');
      }

      const userInfoRequired = { userId, currentPassword };

      // 사용자 정보를 업데이트함.
      const deleteUserInfo = await userService.deleteUser(userInfoRequired);

      // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
      res.status(200).json(deleteUserInfo);

  }
));

userRouter.post('/user/reset-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new Error('해당 메일로 가입된 사용자가 없습니다.');
  }
  
  const newPassword = generateRandomPassword();
  const newHashedPassword = await bcrypt.hash(newPassword, 10);
  
  const resetPasswordUser = await userService.changeToRandomPassword(user._id,newHashedPassword);
  
  const sendMail = await sendChangePassword(email, '임시 비밀번호가 발급되었습니다', `회원님의 임시 비밀번호는 [${newPassword}] 입니다.`);
  
  res.status(200).json(resetPasswordUser);
}));

export { userRouter };
