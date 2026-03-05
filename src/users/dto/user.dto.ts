export class UserDto {
  id: number;
  name: string;
  email: string;
  role: string;
  credits: number;
  userLevelId?: number;
  paketId?: number;
  userWallet?: number;
  userBonus?: number;
  userPoint?: number;
  userStatus?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}