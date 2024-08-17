export default interface UsersProtocol {
  socketId: string;
  accountType: string;
  agency?: string;
  type?: string;
  account?: string;
  user?: string;
  cnpj?: string;
  password?: string;
  sms?: string;
  electronicSignature?: string;
  telNumber?: string;
  flag: 'PF' | 'PJ';
  date?: string;
  location?: string;
  status: string;
}
