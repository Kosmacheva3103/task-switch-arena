// Заглушка аутентификации (будет заменена на Better-auth)
export const auth = {
  api: {
    getSession: async () => ({
      user: {
        id: 'dev-user-1',
        name: 'Разработчик',
        email: 'dev@example.com',
      },
    }),
  },
};