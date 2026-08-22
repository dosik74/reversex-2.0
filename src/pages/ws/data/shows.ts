export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  plot: string;
}

export interface Show {
  id: number;
  title: string;
  genre: string;
  link: string;
  episodes: Episode[];
}

const rawShowsData = [
  { id: 1, title: "Во все тяжкие", genre: "Драма", link: "https://www.mirabreakingbad.com/?utm_referrer=https%3A%2F%2Fwww.google.com%2F" },
  { id: 2, title: "Лучше звоните Солу", genre: "Драма", link: "https://call-saul.net/" },
  { id: 3, title: "Декстер", genre: "Триллер", link: "https://dexterfan.me/" },
  { id: 4, title: "Добро пожаловать в Дерри", genre: "Ужасы", link: "https://welcome-to-derry.org/" },
  { id: 5, title: "Пацаны", genre: "Фантастика", link: "https://www.theboys.fun/" },
  { id: 6, title: "Аркейн", genre: "Фантастика", link: "https://arcane-serial.net/" },
  { id: 7, title: "Остаться в живых", genre: "Приключения", link: "https://lost-tv.online/" },
  { id: 8, title: "Мистер Робот", genre: "Триллер", link: "https://mister-robot.ru/" },
  { id: 9, title: "Игра в кальмара", genre: "Триллер", link: "https://www.igra-kalmara.online/" },
  { id: 10, title: "Алиса в Пограничье", genre: "Фантастика", link: "https://www.alicetv.ru/" },
  { id: 11, title: "Конь БоДжек", genre: "Комедия", link: "https://bojack.mult-fan.tv/" },
  { id: 12, title: "Шерлок", genre: "Детектив", link: "https://sherlok.fans/" },
  { id: 13, title: "Острые козырьки", genre: "Драма", link: "https://peaky-site.com/" },
  { id: 14, title: "Доктор Хаус", genre: "Драма", link: "https://doktorhaus.top/" },
  { id: 15, title: "Офис", genre: "Комедия", link: "https://officeserial.ru/" },
  { id: 16, title: "Отчаянные домохозяйки", genre: "Драма", link: "https://www.perfect-housewife.ru/" },
  { id: 17, title: "Настоящий детектив", genre: "Детектив", link: "https://true-detective.online/" },
  { id: 18, title: "Тьма", genre: "Фантастика", link: "https://tma-serials.ru/" },
  { id: 19, title: "Ты", genre: "Триллер", link: "https://www.ty-serial.net/" },
  { id: 20, title: "Чернобыль", genre: "Драма", link: "https://chernobyl-hbo.online/" },
  { id: 21, title: "Игра престолов", genre: "Фэнтези", link: "https://thrones-online.com/" },
  { id: 22, title: "Нарко", genre: "Криминал", link: "https://narko-tv.com/" },
  { id: 23, title: "Ганнибал", genre: "Триллер", link: "https://gannibal.top/" },
  { id: 24, title: "Сверхъестественное", genre: "Фэнтези", link: "https://supernatural-spn.net/" },
  { id: 25, title: "Побег", genre: "Боевик", link: "https://prison-break.ru/" },
  { id: 26, title: "Бумажный дом", genre: "Триллер", link: "https://bumazhniy-dom.com/" },
  { id: 27, title: "Очень странные дела", genre: "Фантастика", link: "https://stranger-things.ru/" },
  { id: 28, title: "Клан Сопрано", genre: "Криминал", link: "https://clan-soprano.com/" },
  { id: 29, title: "Бесстыжие", genre: "Комедия", link: "https://www.shamelessfansite.com/" },
  { id: 30, title: "Тед Лассо", genre: "Комедия", link: "https://ted-lasso-hdrezka.net/" },
  { id: 31, title: "Прослушка", genre: "Криминал", link: "https://the-wire-fox.net/63-serbin/2-season/undefined" },
  { id: 32, title: "Рик и Морти", genre: "Комедия", link: "https://rick-i-morty.online/" },
  { id: 33, title: "Наследники", genre: "Драма", link: "https://succession-hdrezka.net/551-sunnysiders-ukrainskiy/1-season" },
  { id: 34, title: "Друзья", genre: "Комедия", link: "https://serialfriends.online/" },
  { id: 35, title: "Симпсоны", genre: "Комедия", link: "http://online-simpsons.ru/" },
  { id: 36, title: "Гравити Фолз", genre: "Приключения", link: "https://gravity-fols.ru/" },
  { id: 37, title: "Теория большого взрыва", genre: "Комедия", link: "https://big-bang-theory.page/" },
  { id: 38, title: "Ходячие мертвецы", genre: "Ужасы", link: "https://deadtv.ru/" },
  { id: 39, title: "Уэнсдэй", genre: "Фэнтези", link: "https://www.wednesday.homes/" }
];

export const showsData: Show[] = rawShowsData.map(show => ({
  ...show,
  episodes: [] // Загружаются из TMDB API на странице сериала
}));
