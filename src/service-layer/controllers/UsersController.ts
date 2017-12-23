import {Route, Response, Get, Post, Patch, Header, Body, Security, Controller, Path, Tags} from 'tsoa';
import {validate} from 'class-validator';
import {forEach, pick} from 'lodash';

import {IUserCreateRequest, IUserUpdateRequest} from '../request';
import {IUserResponse, IErrorResponse} from '../responses';
import {validateUserRegistration} from '../../business-layer/validators/user/UserValidationProcessor';
import {createAuthToken} from '../../business-layer/security/token-helpers';

import {UserDataAgent} from '../../data-layer/data-agents/UserDataAgent';
import {UserModel} from '../../data-layer/models/UserModel';

import {logger} from '../../middleware/common/logging';


@Route('users')
export class UsersController extends Controller {


  userDataAgent: UserDataAgent = new UserDataAgent();

  @Post()
  @Tags('Users')
  public async RegisterNewUser(@Body()  request: IUserCreateRequest): Promise<IUserResponse> {
    let validationErrors: any[] = await validateUserRegistration(request);
    logger.info('RegisterNewUser  validationErrors =', validationErrors);
    if (validationErrors.length > 0) {
      throw {
        thrown: true,
        status: 401,
        message: 'incorrect input',
        data: validationErrors
      };
    }
    let result = await this.userDataAgent.createNewUser(request);
    if (result.id) {
      let newUser = new UserModel(result);
      let loginResult = Object.assign({
        account: {
          user: newUser.getClientUserModel(),
          token: createAuthToken(result.id)
        }
      });
      return <IUserResponse>(loginResult);
    } else {

      throw result;

    }
  }


  @Security('api_key')
  @Get('{userId}')
  @Tags('Users')
  public async GetUserById(userId: string, @Header('x-access-token') authentication: string): Promise<IUserResponse> {
    let result = await this.userDataAgent.getUserById(userId);
    if (result && result.username) {
      let aUser = new UserModel(result);
      return <IUserResponse>(aUser.getClientUserModel());
    } else {
      if (result) {
        throw {
          thrown: true,
          status: 401,
          message: result.message.toString()
        };
      } else {

        throw{
          thrown: true,
          status: 404,
          message: 'no such user exist'
        };

      }
    }
  }


  @Response<IErrorResponse>('404', 'no such user exist')
  @Get('username/{username}')
  @Tags('Users')
  public async GetUserByUsername(@Path() username: string): Promise<IUserResponse> {
    let result = await this.userDataAgent.getByUsername(username);
    if (result && result.username) {
      let aUser = new UserModel(result);
      return <IUserResponse>({user: aUser.getClientUserModel()});
    } else {
      throw result;
    }
  }


  @Patch()
  @Tags('Users')
  public async Update(@Body() request: IUserUpdateRequest): Promise<IUserResponse> {
    let result = await this.userDataAgent.updateUserProfile(request);
    if (result.id) {
      let aUser = new UserModel(result);
      return <IUserResponse>(aUser.getClientUserModel());
    } else {
      throw result;
    }
  }


}