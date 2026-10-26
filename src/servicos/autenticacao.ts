import bcrypt from 'bcryptjs';

export async function validarSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}