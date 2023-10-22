// @ts-check

export default {
  translation: {
    appName: 'Менеджер задач',
    flash: {
      session: {
        create: {
          success: 'Вы залогинены',
          error: 'Неправильный емейл или пароль',
        },
        delete: {
          success: 'Вы разлогинены',
        },
      },
      users: {
        create: {
          error: 'Не удалось зарегистрировать',
          success: 'Пользователь успешно зарегистрирован',
        },
        edit: {
          success: 'Пользователь успешно изменён',
        },
        delete: {
          success: 'Пользователь успешно удалён',
        },
        authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      },
      statuses: {
        create: {
          success: 'Статус успешно создан',
        },
        update: {
          success: 'Статус успешно изменён',
        },
        delete: {
          success: 'Статус успешно удалён',
        },
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      tasks: {
        create: {
          success: 'Задача успешно создана',
        },
        update: {
          success: 'Задача успешно изменена',
        },
        delete: {
          success: 'Задача успешно удалена',
        },
      },
    },
    layouts: {
      application: {
        users: 'Пользователи',
        signIn: 'Вход',
        signUp: 'Регистрация',
        signOut: 'Выход',
        statuses: 'Статусы',
        tasks: 'Задачи',
      },
    },
    views: {
      session: {
        new: {
          signIn: 'Вход',
          submit: 'Войти',
        },
      },
      users: {
        id: 'ID',
        firstName: 'Полное имя',
        lastName: '',
        email: 'Email',
        createdAt: 'Дата создания',
        new: {
          submit: 'Сохранить',
          signUp: 'Регистрация',
        },
        actions: {
          header: 'Действия',
          delete: 'Удалить',
          edit: 'Изменить',
        },
        edit: {
          submit: 'Сохранить',
        },
      },
      welcome: {
        index: {
          hello: 'Привет от Хекслета!',
          description: 'Практические курсы по программированию',
          more: 'Узнать Больше',
        },
      },
      statuses: {
        createdAt: 'Дата создания',
        id: 'ID',
        name: 'Наименование',
        newStatus: {
          submit: 'Создать',
          header: 'Создание статуса',
        },
        editStatus: {
          submit: 'Изменить статус',
          header: 'Изменение статуса',
        },
        createNewStatusSubmitButton: 'Создать статус',
        actions: {
          delete: 'Удалить',
          edit: 'Изменить',
        },
      },
      tasks: {
        createNewTaskButton: 'Создать задачу',
        id: 'ID',
        name: 'Наименование',
        status: 'Статус',
        creator: 'Автор',
        executor: 'Исполнитель',
        createdAt: 'Дата создания',
        actions: {
          header: 'Действия',
          edit: 'Изменить',
          delete: 'Удалить',
        },
        editTask: {
          submit: 'Изменить',
          title: 'Изменение задачи',
        },
        newTask: {
          title: 'Создание задачи',
          submit: 'Создать',
        },
        executorId: 'Исполнитель',
        statusId: 'Статус',
        description: 'описание задачи',
      },
    },
  },
};
