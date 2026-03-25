import { prisma } from './db';

interface AuthUser {
  uid: string;
  email?: string;
  name?: string;
}

export async function getOrCreateUser(authUser: AuthUser) {
  let user = await prisma.user.findUnique({
    where: { firebaseUid: authUser.uid },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseUid: authUser.uid,
        email: authUser.email || '',
        name: authUser.name || null,
      },
    });
  }

  return user;
}
