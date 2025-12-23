export class UserDto {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  referralCode?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}