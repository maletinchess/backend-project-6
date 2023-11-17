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
          error: 'Если пользователь связан хотя бы с одной задачей, его нельзя удалить',
        },
        authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      },
      statuses: {
        create: {
          success: 'Статус успешно создан',
          error: 'Не удалось создать статус',
        },
        update: {
          success: 'Статус успешно изменён',
        },
        delete: {
          success: 'Статус успешно удалён',
          error: 'Если статус связан хотя бы с одной задачей, его нельзя удалить',
        },
      },
      authError: 'Доступ запрещён! Пожалуйста, авторизируйтесь.',
      tasks: {
        create: {
          success: 'Задача успешно создана',
        },
        update: {
          success: 'Задача успешно изменена',
          error: 'Редактировать задачи может только создатель',
        },
        delete: {
          success: 'Задача успешно удалена',
          authError: 'Доступ запрещён! Удалять задачи может только создатель.',
        },
      },
      labels: {
        create: {
          success: 'Метка успешно создана',
          error: 'Не удалось создать метку',
        },
        update: {
          success: 'Метка успешно изменена',
        },
        delete: {
          success: 'Метка успешно удалена',
          error: 'Если метка связана с задачей, её нельзя удалить',
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
        labels: 'Метки',
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
          header: 'Изменение пользователя',
          submit: 'Изменить',
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
          submit: 'Изменить',
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
        labels: 'Метки',
        executorId: 'Исполнитель',
        statusId: 'Статус',
        description: 'описание задачи',
        filter: {
          status: 'Статус',
          executor: 'Исполнитель',
          label: 'Метки',
          submit: 'Показать',
          checkbox: 'Только мои задачи',
        },

      },
      labels: {
        createNewLabelButton: 'Создать метку',
        id: 'ID',
        name: 'Наименование',
        createdAt: 'Дата создания',
        newLabel: {
          header: 'Создание Метки',
          submit: 'Создать',
        },
        editLabel: {
          title: 'Изменение Метки',
          submit: 'Изменить',
        },
        actions: {
          header: 'Действия',
          edit: 'Изменить',
          delete: 'Удалить',
        },
        email: 'Email',
        password: 'Пароль',
        firstName: 'Имя',
        lastName: 'Фамилия',
      },
    },
  },
};
