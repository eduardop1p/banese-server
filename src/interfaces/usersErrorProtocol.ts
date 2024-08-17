export default interface UsersErrorProtocol {
  socketId: string;
  status: string;
  errors: { message: string; type: string }[];
}
