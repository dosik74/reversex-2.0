import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const storedLng = typeof window !== 'undefined' ? localStorage.getItem('lng') : null;

const resources = {
  ru: {
    translation: {
      nav: {
        movies: 'Фильмы',
        series: 'Сериалы',
        games: 'Игры',
        music: 'Музыка',
        books: 'Книги',
        profile: 'Профиль',
        signOut: 'Выйти',
        notifications: 'Уведомления',
        messages: 'Сообщения',
      },
      index: {
        heroTitle: 'Reverse',
        heroSubtitle: 'Персональный трекер и рекомендации',
        searchPlaceholder: 'Поиск фильмов, сериалов, игр...'
      },
      movies: {
        explore: 'Исследуйте фильмы',
        searchPlaceholder: 'Поиск фильмов...',
        noResults: 'Ничего не найдено',
        loadMore: 'Показать ещё'
      },
      workspace: {
        title: 'Workspace',
        signInToWorkspace: 'Войти в workspace',
        createNewWorkspace: 'Создать новый workspace',
        email: 'Email',
        password: 'Пароль',
        signIn: 'Войти',
        signUp: 'Зарегистрироваться',
        dontHaveAccount: 'Нет аккаунта?',
        alreadyHaveAccount: 'Уже есть аккаунт?',
        backToReverseX: '← Вернуться в reverseX',
        projects: 'Проекты',
        createProject: 'Создать проект',
        projectName: 'Название проекта',
        projectDescription: 'Описание проекта (опционально)',
        create: 'Создать',
        cancel: 'Отмена',
        boards: 'Доски',
        createNewBoard: 'Создать новую доску',
        boardName: 'Название доски (например, Design, Music)',
        description: 'Описание (опционально)',
        teamMembers: 'Члены команды',
        inviteCode: 'Код приглашения',
        shareProject: 'Поделиться проектом',
        settings: 'Параметры',
        newBoard: 'Новая доска',
        planned: 'В планах',
        inProgress: 'Делается',
        done: 'Сделано',
        abandoned: 'Брошено',
        addTask: 'Добавить задачу',
        taskTitle: 'Заголовок задачи',
        add: 'Добавить',
        loading: 'Загрузка...',
        createdBy: 'Создал',
        assignedTo: 'Назначен',
      }
    }
  },
  kk: {
    translation: {
      nav: {
        movies: 'Фильмдер',
        series: 'Сериалдар',
        games: 'Ойындар',
        music: 'Музыка',
        books: 'Кітаптар',
        profile: 'Профиль',
        signOut: 'Шығу',
        notifications: 'Хабарландырулар',
        messages: 'Хабарламалар',
      },
      index: {
        heroTitle: 'Reverse',
        heroSubtitle: 'Жеке трекер және ұсыныстар',
        searchPlaceholder: 'Фильмдер, сериалдар, ойындар іздеу...'
      },
      movies: {
        explore: 'Фильмдерді зерттеңіз',
        searchPlaceholder: 'Фильмдерді іздеу...',
        noResults: 'Ештеңе табылмады',
        loadMore: 'Тағы көрсету'
      },
      workspace: {
        title: 'Workspace',
        signInToWorkspace: 'Workspace-ке кіріңіз',
        createNewWorkspace: 'Жаңа workspace құрыңыз',
        email: 'Email',
        password: 'Пароль',
        signIn: 'Кіру',
        signUp: 'Тіркелу',
        dontHaveAccount: 'Аккаунтыңыз жоқ па?',
        alreadyHaveAccount: 'Әлдеқайда аккаунтыңыз бар ма?',
        backToReverseX: '← ReverseX-ке қайту',
        projects: 'Жобалар',
        createProject: 'Жоба құру',
        projectName: 'Жоба аты',
        projectDescription: 'Жоба сипаттамасы (міндетті емес)',
        create: 'Құру',
        cancel: 'Бас тарту',
        boards: 'Тақталар',
        createNewBoard: 'Жаңа тақта құрыңыз',
        boardName: 'Тақта аты (мысалы, Design, Music)',
        description: 'Сипаттама (міндетті емес)',
        teamMembers: 'Команда мүшелері',
        inviteCode: 'Шақырту коды',
        shareProject: 'Жобаны ортақ пайдалану',
        settings: 'Параметрлер',
        newBoard: 'Жаңа тақта',
        planned: 'Жоспарлануы',
        inProgress: 'Орындалуда',
        done: 'Орындалды',
        abandoned: 'Тасталды',
        addTask: 'Тапсырма қосыңыз',
        taskTitle: 'Тапсырманың атауы',
        add: 'Қосу',
        loading: 'Жүктелуде...',
        createdBy: 'Құрады',
        assignedTo: 'Тағайындалды',
      }
    }
  },
  en: {
    translation: {
      nav: {
        movies: 'Movies',
        series: 'Series',
        games: 'Games',
        music: 'Music',
        books: 'Books',
        profile: 'Profile',
        signOut: 'Sign Out',
        notifications: 'Notifications',
        messages: 'Messages',
      },
      index: {
        heroTitle: 'Reverse',
        heroSubtitle: 'Your personal tracking and recommendations',
        searchPlaceholder: 'Search movies, series, games...'
      },
      movies: {
        explore: 'Explore Movies',
        searchPlaceholder: 'Search movies...',
        noResults: 'No movies found',
        loadMore: 'Load more'
      },
      workspace: {
        title: 'Workspace',
        signInToWorkspace: 'Sign in to your workspace',
        createNewWorkspace: 'Create a new workspace',
        email: 'Email',
        password: 'Password',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        dontHaveAccount: "Don't have an account?",
        alreadyHaveAccount: 'Already have an account?',
        backToReverseX: '← Back to reverseX',
        projects: 'Projects',
        createProject: 'Create Project',
        projectName: 'Project name',
        projectDescription: 'Project description (optional)',
        create: 'Create',
        cancel: 'Cancel',
        boards: 'Boards',
        createNewBoard: 'Create New Board',
        boardName: 'Board name (e.g., Design, Music)',
        description: 'Description (optional)',
        teamMembers: 'Team Members',
        inviteCode: 'Invite Code',
        shareProject: 'Share Project',
        settings: 'Settings',
        newBoard: 'New Board',
        planned: 'Planned',
        inProgress: 'In Progress',
        done: 'Done',
        abandoned: 'Abandoned',
        addTask: 'Add Task',
        taskTitle: 'Task title',
        add: 'Add',
        loading: 'Loading...',
        createdBy: 'Created by',
        assignedTo: 'Assigned to',
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLng || 'ru',
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
