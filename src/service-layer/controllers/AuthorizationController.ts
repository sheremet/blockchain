import {Route, Get, Post, Delete, Response, Header, Body, Controller, Tags} from 'tsoa';
import {IUserLoginRequest} from '../request';
import {IUserResponse, IMessageResponse} from '../responses';
import {createAuthToken} from '../../business-layer/security/token-helpers';
import {UserDataAgent} from '../../data-layer/data-agents/UserDataAgent';
import {UserModel} from '../../data-layer/models/UserModel';
import {logger} from '../../middleware/common/logging';


@Route('auth')
export class AuthorizationsController extends Controller {

  userDataAgent = new UserDataAgent();

  @Post('login')
  @Tags('Authorizations')
  public async login(@Body() request: IUserLoginRequest): Promise<IUserResponse> {

    let result = await this.userDataAgent.getAuthorizedUser(request);
    if (result.id) {
      let authedUser = new UserModel(result);
      let loginResult = Object.assign({
        account: {
          user: authedUser.getClientUserModel(),
          token: createAuthToken(result.id)
        }
      });
      return <IUserResponse>(loginResult);
    } else {
      throw result;
    }
  }

  @Post('logout')
  @Tags('Authorizations')
  public async logout(@Header('x-access-token') authentication: string): Promise<IMessageResponse> {
    //  TODO: set up validation with redis and tracking of token... especially when email validation is available.
    let logoutResult = Object.assign({general: {message: 'user logged out', success: true}});
    return <IMessageResponse>(logoutResult);
  }

}