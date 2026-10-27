require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Telegraf, Markup } = require('telegraf');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://google.com';
const DB_FILE = path.join(__dirname, 'db.json');

// ================= БАЗА КАРТОЧЕК =================
const CARDS_DB = [
  // 1. UFC
  { id: 'ufc_1', name: 'Хабиб Нурмагомедов', cat: 'UFC', rarity: 'Legendary', stats: { atk: 92, def: 99, spd: 84 }, img: '/images/khabib.png', bio: '29-0. Абсолютный контроль в партере.', ability: { name: 'Борцовский замок', desc: 'Удар в партере на 120 урона' } },
  { id: 'ufc_2', name: 'Конор Макгрегор', cat: 'UFC', rarity: 'Epic', stats: { atk: 97, def: 68, spd: 91 }, img: '/images/conor.png', bio: 'Левая рука отправляет спать за секунды.', ability: { name: 'Левый нокаут', desc: 'Крит в 250% урона' } },
  { id: 'ufc_3', name: 'Джон Джонс', cat: 'UFC', rarity: 'Mythic', stats: { atk: 98, def: 98, spd: 89 }, img: '/images/jones.png', bio: 'Непобедимый чемпион двух дивизионов.', ability: { name: 'Косые удары', desc: 'Снижает атаку врага на 40%' } },
  { id: 'ufc_4', name: 'Алекс Перейра', cat: 'UFC', rarity: 'Legendary', stats: { atk: 100, def: 74, spd: 80 }, img: '/images/pereira.png', bio: 'Каменная рука Poatan.', ability: { name: 'Каменный хук', desc: 'Пробивает блок (+35 урона)' } },
  { id: 'ufc_5', name: 'Шон О\'Мэлли', cat: 'UFC', rarity: 'Rare', stats: { atk: 89, def: 66, spd: 95 }, img: '/images/omalley.png', bio: 'Сахарок. Снайперский тайминг.', ability: { name: 'Финт с разворота', desc: 'Уклонение от любого удара' } },

  // 2. ФУТБОЛ
  { id: 'ft_1', name: 'Лионель Месси', cat: 'Футбол', rarity: 'Mythic', stats: { atk: 99, def: 50, spd: 92 }, img: '/images/messi.png', bio: '8 Золотых мячей. Чемпион мира 2022.', ability: { name: 'Дриблинг бога', desc: 'Игнорирует защиту соперника' } },
  { id: 'ft_2', name: 'Криштиану Роналду', cat: 'Футбол', rarity: 'Legendary', stats: { atk: 98, def: 62, spd: 94 }, img: '/images/ronaldo.png', bio: 'Машина голов, рекордов и побед. SIUUU!', ability: { name: 'SIUUUU!', desc: 'Мощный добивающий удар' } },
  { id: 'ft_3', name: 'Килиан Мбаппе', cat: 'Футбол', rarity: 'Epic', stats: { atk: 95, def: 52, spd: 100 }, img: '/images/mbappe.png', bio: 'Реактивная скорость.', ability: { name: 'Рывок гепарда', desc: '+30 к скорости и двойной удар' } },
  { id: 'ft_4', name: 'Эрлинг Холанд', cat: 'Футбол', rarity: 'Epic', stats: { atk: 99, def: 72, spd: 90 }, img: '/images/haaland.png', bio: 'Норвежский робот-бомбардир.', ability: { name: 'Таран викинга', desc: 'Оглушает врага на раунд' } },

  // 3. БАСКЕТБОЛ
  { id: 'nba_1', name: 'Майкл Джордан', cat: 'Баскетбол', rarity: 'Mythic', stats: { atk: 100, def: 95, spd: 96 }, img: '/images/jordan.png', bio: 'Его Воздушество. 6 перстней NBA.', ability: { name: 'Полет легенды', desc: 'Удваивает урон' } },
  { id: 'nba_2', name: 'Леброн Джеймс', cat: 'Баскетбол', rarity: 'Legendary', stats: { atk: 97, def: 93, spd: 89 }, img: '/images/lebron.png', bio: 'Король Джеймс.', ability: { name: 'Блок-шот короля', desc: 'Блокирует 50% урона' } },
  { id: 'nba_3', name: 'Стеф Карри', cat: 'Баскетбол', rarity: 'Epic', stats: { atk: 99, def: 60, spd: 91 }, img: '/images/curry.png', bio: 'Величайший трехочковый снайпер.', ability: { name: 'Снайпер 3-очковых', desc: 'Наносит 110 дальнего урона' } },

  // 4. РЭП
  { id: 'rap_1', name: 'Eminem', cat: 'Рэп', rarity: 'Legendary', stats: { atk: 99, def: 85, spd: 98 }, img: '/images/eminem.png', bio: 'Rap God. Быстрейшая читка планеты.', ability: { name: 'Сверхзвуковой флоу', desc: 'Двойная серия ударов' } },
  { id: 'rap_4', name: 'Big Baby Tape', cat: 'Рэп', rarity: 'Rare', stats: { atk: 82, def: 79, spd: 80 }, img: '/images/tape.png', bio: 'Trap Luv и Dragonborn.', ability: { name: 'Трэп-басс', desc: 'Оглушение соперника' } },
  { id: 'rap_5', name: 'OG Buda', cat: 'Рэп', rarity: 'Common', stats: { atk: 74, def: 65, spd: 76 }, img: '/images/buda.png', bio: 'Детройт-стиль и фристайл.', ability: { name: 'Фристайл', desc: '+20 случайного урона' } },

  // 5. СТРИМЕРЫ
  { id: 'str_2', name: 'Mellstroy', cat: 'Стримеры', rarity: 'Epic', stats: { atk: 88, def: 64, spd: 89 }, img: '/images/mellstroy.png', bio: 'Главный генератор вирусных заданий.', ability: { name: 'Хайп-раздача', desc: 'Ослепляет вспышкой денег' } },
  { id: 'str_3', name: 'Zubarefff', cat: 'Стримеры', rarity: 'Rare', stats: { atk: 81, def: 87, spd: 76 }, img: '/images/zubareff.png', bio: 'Король обзоров пельменей.', ability: { name: 'Душевный стрим', desc: 'Лечит 35 здоровья' } },
  { id: 'str_4', name: 'Buster', cat: 'Стримеры', rarity: 'Rare', stats: { atk: 85, def: 75, spd: 85 }, img: '/images/buster.png', bio: 'Полковник Бустеренко.', ability: { name: 'Заряд онлайна', desc: '+15 к атаке' } },

  // 6. КИНО
  { id: 'mov_1', name: 'Райан Гослинг', cat: 'Кино', rarity: 'Legendary', stats: { atk: 89, def: 95, spd: 82 }, img: '/images/gosling.png', bio: 'Буквально я. Герой фильма Драйв.', ability: { name: 'Я просто еду', desc: 'Броня титана: защита +50' } },
  { id: 'mov_2', name: 'Киану Ривз (Джон Уик)', cat: 'Кино', rarity: 'Legendary', stats: { atk: 98, def: 96, spd: 91 }, img: '/images/wick.png', bio: 'Баба-Яга.', ability: { name: 'Карандаш Уика', desc: '120 чистого урона' } },

  // 7. МЕМЫ
  { id: 'meme_1', name: 'Гигачад (GigaChad)', cat: 'Мемы', rarity: 'Legendary', stats: { atk: 99, def: 99, spd: 85 }, img: '/images/gigachad.png', bio: 'Идеальное спокойствие и челюсть титана.', ability: { name: 'Аура Чада', desc: 'Устрашение: враг теряет 25% урона' } },
  { id: 'meme_2', name: 'Доге (Doge)', cat: 'Мемы', rarity: 'Common', stats: { atk: 65, def: 65, spd: 70 }, img: '/images/doge.png', bio: 'Much wow. So crypto.', ability: { name: 'Гав-памп', desc: '+15 ко всем статам' } }
];

// СЮЖЕТ
const CAMPAIGN_CHAPTERS = [
  { level: 1, title: 'Глава 1: Дворовой спарринг', bossName: 'Боевой Доге', enemyCardId: 'meme_2', hp: 100, lore: 'Ты начинаешь карьеру бойца в тихом дворе. Твой первый соперник — неугомонный Доге!', dilemma: { text: 'Перед боем тренер предлагает выпить предтреник. Что выберете?', optA: { text: '⚡ Выпить энергетик (+25% урона)', buff: 'atk' }, optB: { text: '🛡️ Размять связки (+30 к HP)', buff: 'hp' } }, bossTelegraphs: [{ clue: 'Доге бешено лает и готовится к прыжку!', counter: 'defend', punishMsg: 'Вы заблокировали прыжок и контратаковали!' }, { clue: 'Доге прижал уши и ушел в глухую защиту!', counter: 'attack', punishMsg: 'Вы пробили его слабую защиту мощным хуком!' }], rewardCoins: 400, rewardDust: 40 },
  { level: 2, title: 'Глава 2: Подвал на Детройте', bossName: 'OG Buda', enemyCardId: 'rap_5', hp: 130, lore: 'Тёмный клуб, дым и бит. Здесь решают не перчатки, а хладнокровие под грязный флоу.', dilemma: { text: 'В раздевалке играет тяжелый трэп. Сконцентрироваться на слухе?', optA: { text: '🎧 Надеть наушники (+20 SPD)', buff: 'spd' }, optB: { text: '🔥 Настроиться на злость (+25 ATK)', buff: 'atk' } }, bossTelegraphs: [{ clue: 'Buda читает быстрый фристайл и готовит серию джебов!', counter: 'defend', punishMsg: 'Вы поймали его на ошибке в ритме!' }, { clue: 'Buda сбился с бита и опустил руки!', counter: 'attack', punishMsg: 'Сокрушительный апперкот точно в челюсть!' }], rewardCoins: 600, rewardDust: 60 },
  { level: 3, title: 'Глава 3: Снайпер октагона', bossName: 'Шон О\'Мэлли', enemyCardId: 'ufc_5', hp: 150, lore: 'Яркие огни арены. Шон постоянно двигается, меняя стойки с левши на правшу.', dilemma: { text: 'Шон пытается вывести вас из себя трештоком на взвешивании. Ваш ответ?', optA: { text: '🤫 Промолчать (Иммунитет к критам)', buff: 'def' }, optB: { text: '🥊 Оскалиться в ответ (+35% к шкале ярости)', buff: 'rage' } }, bossTelegraphs: [{ clue: 'Шон крутит вертушку ногой с разворота!', counter: 'defend', punishMsg: 'Вы присели под ногой и нанесли удар в корпус!' }, { clue: 'Шон замер на одной ноге после неудачного финта!', counter: 'attack', punishMsg: 'Точный прямой удар навстречу!' }], rewardCoins: 800, rewardDust: 100, rewardCardId: 'ufc_5' },
  { level: 4, title: 'Глава 4: Ирландский шторм', bossName: 'Конор Макгрегор', enemyCardId: 'ufc_2', hp: 180, lore: 'Переполненный стадион гудит. Конор заряжает свою левую руку, готовя нокаут в первом раунде.', dilemma: { text: 'Какую тактику выбрать на бой против короля трештока?', optA: { text: '🏃 Дистанция и футворк (+25 DEF)', buff: 'def' }, optB: { text: '💥 Рубка на встречных курсах (+35 ATK)', buff: 'atk' } }, bossTelegraphs: [{ clue: 'Конор опустил правую руку и выцеливает левой кувалдой!', counter: 'defend', punishMsg: 'Идеальный блок левой руки! Конор обескуражен!' }, { clue: 'Конор пошел вперед с открытым подбородком!', counter: 'attack', punishMsg: 'Встречный боковой потряс ирландца!' }], rewardCoins: 1100, rewardDust: 150 },
  { level: 5, title: 'Глава 5: Костяной Трон', bossName: 'Джон Джонс', enemyCardId: 'ufc_3', hp: 215, lore: 'Непобедимый чемпион двух весовых дивизионов. Он видит любую слабость и бьет косыми ударами.', dilemma: { text: 'Джонс славится своим гигантским размахом рук. Как сократить дистанцию?', optA: { text: '🥋 Проход в клинч (+30 DEF)', buff: 'def' }, optB: { text: '💥 Взрывной оверхенд (+40 ATK)', buff: 'atk' } }, bossTelegraphs: [{ clue: 'Джонс закручивает острый удар локтем с разворота!', counter: 'defend', punishMsg: 'Вы укрылись за блоком и поглотили страшный удар локтем!' }, { clue: 'Джонс заигрался на дальней дистанции и открыл печень!', counter: 'attack', punishMsg: 'Мощный боковой удар в корпус заставил Джонса отступить!' }], rewardCoins: 1600, rewardDust: 300, rewardCardId: 'ufc_3' },
  { level: 6, title: 'Глава 6: Вершина Октагона — Финал', bossName: 'Хабиб "Орел"', enemyCardId: 'ufc_1', hp: 250, lore: 'Финальный босс игры. 29 побед и 0 поражений. Гора Дагестана. Время сотворить историю!', dilemma: { text: 'Главный бой жизни. Что вы берете с собой в октагон?', optA: { text: '🦅 Стальной характер (+50 HP и +20 DEF)', buff: 'hp' }, optB: { text: '🔥 Ярость претендента (+50 ATK)', buff: 'atk' } }, bossTelegraphs: [{ clue: 'Хабиб приседает и ныряет в две ноги для тейкдауна!', counter: 'defend', punishMsg: 'Идеальный спрэд! Вы остановили проход Орла!' }, { clue: 'Хабиб пошел на сближение для оверхенда с правой!', counter: 'attack', punishMsg: 'Встречный джеб остановил напор чемпиона!' }], rewardCoins: 3000, rewardDust: 600, rewardCardId: 'ufc_1' }
];

const TRIVIA_HUNT = [
  { id: 1, clue: "За сколько секунд Конор Макгрегор нокаутировал Жозе Альдо в 2015 году?", options: ["13 секунд", "45 секунд", "1 минута", "5 секунд"], correctIndex: 0, rewardCardId: 'ufc_2' },
  { id: 2, clue: "Какой футболист забил рекордный 91 гол за один календарный 2012 год?", options: ["Роналду", "Месси", "Неймар", "Холанд"], correctIndex: 1, rewardCardId: 'ft_1' },
  { id: 3, clue: "Какой актер сыграл молчаливого водителя в фильме 'Драйв' (мем 'Буквально я')?", options: ["Ди Каприо", "Райан Гослинг", "Киану Ривз", "Брэд Питт"], correctIndex: 1, rewardCardId: 'mov_1' },
  { id: 4, clue: "В каком треке Eminem зачитал 1560 слов за 6 минут?", options: ["Lose Yourself", "Without Me", "Rap God", "Stan"], correctIndex: 2, rewardCardId: 'rap_1' },
  { id: 5, clue: "С каким рекордом побед и поражений Хабиб завершил карьеру в UFC?", options: ["27-0", "29-0", "30-0", "29-1"], correctIndex: 1, rewardCardId: 'ufc_1' }
];

let usersData = {};
function loadDatabase() {
  try { if (fs.existsSync(DB_FILE)) usersData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch (e) { usersData = {}; }
}
function saveDatabase() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(usersData, null, 2), 'utf-8'); } catch (e) {}
}
loadDatabase();

function getUser(tgId, tgUser = null) {
  if (!usersData[tgId]) {
    usersData[tgId] = {
      id: tgId,
      nickname: tgUser?.first_name ? `${tgUser.first_name}` : 'Игрок',
      avatar: '👑',
      coins: 1800,
      dust: 120,
      rating: 1000,
      pityCounter: 0,
      lastDaily: 0,
      lastRoulette: 0,
      campaignProgress: 1,
      cardStats: {},
      inventory: ['meme_2', 'rap_5', 'ufc_5'],
      completedQuests: [],
      stats: { casesOpened: 0, battlesTotal: 0, battlesWon: 0, questsCompleted: 0, memoryCompleted: 0 }
    };
    saveDatabase();
  }
  if (!usersData[tgId].campaignProgress) usersData[tgId].campaignProgress = 1;
  if (!usersData[tgId].cardStats) usersData[tgId].cardStats = {};
  if (!usersData[tgId].lastRoulette) usersData[tgId].lastRoulette = 0;
  if (!usersData[tgId].stats) usersData[tgId].stats = { casesOpened: 0, battlesTotal: 0, battlesWon: 0, questsCompleted: 0, memoryCompleted: 0 };
  return usersData[tgId];
}

function verifyTelegramWebAppData(telegramInitData) {
  if (!BOT_TOKEN) return false;
  const urlParams = new URLSearchParams(telegramInitData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  const params = [];
  for (const [key, value] of urlParams.entries()) params.push(`${key}=${value}`);
  params.sort();
  const dataCheckString = params.join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  return calculatedHash === hash;
}

function authMiddleware(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) {
    req.userId = 'default_user';
    req.tgUser = null;
    return next();
  }
  if (!verifyTelegramWebAppData(initData)) return res.status(403).json({ error: 'Ошибка верификации' });
  const user = JSON.parse(new URLSearchParams(initData).get('user'));
  req.userId = String(user.id);
  req.tgUser = user;
  next();
}

// API
app.get('/api/profile', authMiddleware, (req, res) => {
  const user = getUser(req.userId, req.tgUser);
  res.json({ id: user.id, nickname: user.nickname, avatar: user.avatar, coins: user.coins, dust: user.dust, rating: user.rating, stats: user.stats, cardStats: user.cardStats, campaignProgress: user.campaignProgress, campaignChapters: CAMPAIGN_CHAPTERS, inventory: user.inventory, lastDaily: user.lastDaily, lastRoulette: user.lastRoulette, allCards: CARDS_DB });
});

app.post('/api/profile/update', authMiddleware, (req, res) => {
  const { nickname, avatar } = req.body;
  const user = getUser(req.userId);
  if (nickname && nickname.trim().length >= 2 && nickname.trim().length <= 16) user.nickname = nickname.trim();
  if (avatar) user.avatar = avatar;
  saveDatabase();
  res.json({ success: true, nickname: user.nickname, avatar: user.avatar });
});

app.post('/api/cases/open', authMiddleware, (req, res) => {
  const { caseTier = 'cheap' } = req.body;
  const user = getUser(req.userId);
  const priceMap = { cheap: 150, medium: 450, gold: 1200, vip: 3000 };
  const cost = priceMap[caseTier] || 150;
  if (user.coins < cost) return res.status(400).json({ error: `Нужно ${cost} 💰` });

  user.coins -= cost;
  user.pityCounter += 1;
  user.stats.casesOpened += 1;

  const rand = Math.random() * 100;
  let targetRarity = 'Common';
  if (caseTier === 'cheap') {
    if (rand < 0.5) targetRarity = 'Legendary';
    else if (rand < 5) targetRarity = 'Epic';
    else if (rand < 25) targetRarity = 'Rare';
    else targetRarity = 'Common';
  } else if (caseTier === 'medium') {
    if (rand < 3) targetRarity = 'Legendary';
    else if (rand < 18) targetRarity = 'Epic';
    else if (rand < 60) targetRarity = 'Rare';
    else targetRarity = 'Common';
  } else if (caseTier === 'gold') {
    if (rand < 4) targetRarity = 'Mythic';
    else if (rand < 30) targetRarity = 'Legendary';
    else if (rand < 90) targetRarity = 'Epic';
    else targetRarity = 'Rare';
  } else if (caseTier === 'vip') {
    if (rand < 10) targetRarity = 'Mythic';
    else if (rand < 55) targetRarity = 'Legendary';
    else targetRarity = 'Epic';
  }

  let candidates = CARDS_DB.filter(c => c.rarity === targetRarity);
  if (candidates.length === 0) candidates = CARDS_DB;
  const droppedCard = candidates[Math.floor(Math.random() * candidates.length)];
  user.inventory.push(droppedCard.id);
  saveDatabase();
  res.json({ card: droppedCard, coins: user.coins, pityCounter: user.pityCounter, stats: user.stats });
});

app.post('/api/daily/claim', authMiddleware, (req, res) => {
  const user = getUser(req.userId);
  const now = Date.now();
  const COOLDOWN = 24 * 60 * 60 * 1000;
  if (now - user.lastDaily < COOLDOWN) {
    const diff = COOLDOWN - (now - user.lastDaily);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return res.status(400).json({ error: `Бонус через ${hours}ч ${mins}м` });
  }
  user.lastDaily = now;
  user.coins += 350;
  const droppedCard = CARDS_DB[Math.floor(Math.random() * CARDS_DB.length)];
  user.inventory.push(droppedCard.id);
  saveDatabase();
  res.json({ bonusCoins: 350, card: droppedCard, coins: user.coins, lastDaily: user.lastDaily });
});

app.post('/api/roulette/spin', authMiddleware, (req, res) => {
  const user = getUser(req.userId);
  const now = Date.now();
  const COOLDOWN = 18 * 60 * 60 * 1000;
  if (now - user.lastRoulette < COOLDOWN) {
    const diff = COOLDOWN - (now - user.lastRoulette);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return res.status(400).json({ error: `Бесплатный спин через ${hours}ч ${mins}м` });
  }

  user.lastRoulette = now;
  const prizes = [
    { type: 'coins', amount: 100, label: '100 💰' },
    { type: 'coins', amount: 300, label: '300 💰' },
    { type: 'dust', amount: 50, label: '50 ✨' },
    { type: 'coins', amount: 500, label: '500 💰' },
    { type: 'card', label: '🎁 КАРТА' },
    { type: 'coins', amount: 1000, label: '1 000 💰' },
    { type: 'dust', amount: 150, label: '150 ✨' },
    { type: 'coins', amount: 200, label: '200 💰' }
  ];
  const prizeIndex = Math.floor(Math.random() * prizes.length);
  const won = prizes[prizeIndex];
  let wonCard = null;
  if (won.type === 'coins') user.coins += won.amount;
  if (won.type === 'dust') user.dust += won.amount;
  if (won.type === 'card') {
    wonCard = CARDS_DB[Math.floor(Math.random() * CARDS_DB.length)];
    user.inventory.push(wonCard.id);
  }
  saveDatabase();
  res.json({ prizeIndex, won, wonCard, coins: user.coins, dust: user.dust, lastRoulette: user.lastRoulette });
});

app.post('/api/battle/finish', authMiddleware, (req, res) => {
  const { userCardId, isVictory } = req.body;
  const user = getUser(req.userId);
  if (!user.cardStats[userCardId]) user.cardStats[userCardId] = { wins: 0, losses: 0 };
  if (isVictory) {
    user.cardStats[userCardId].wins += 1;
    user.rating += 25;
    user.coins += 200;
    user.stats.battlesWon += 1;
  } else {
    user.cardStats[userCardId].losses += 1;
    user.rating = Math.max(100, user.rating - 10);
    user.coins += 25;
  }
  user.stats.battlesTotal += 1;
  saveDatabase();
  res.json({ success: true, isVictory, rating: user.rating, coins: user.coins, cardStats: user.cardStats, stats: user.stats });
});

app.post('/api/campaign/finish', authMiddleware, (req, res) => {
  const { level, userCardId } = req.body;
  const user = getUser(req.userId);
  const chapter = CAMPAIGN_CHAPTERS.find(c => c.level === level);
  if (!chapter) return res.status(404).json({ error: 'Глава не найдена' });

  user.coins += chapter.rewardCoins;
  user.dust += chapter.rewardDust;
  if (chapter.rewardCardId && !user.inventory.includes(chapter.rewardCardId)) {
    user.inventory.push(chapter.rewardCardId);
  }
  if (!user.cardStats[userCardId]) user.cardStats[userCardId] = { wins: 0, losses: 0 };
  user.cardStats[userCardId].wins += 1;

  if (user.campaignProgress === level && level < CAMPAIGN_CHAPTERS.length) {
    user.campaignProgress += 1;
  }
  saveDatabase();
  res.json({ success: true, campaignProgress: user.campaignProgress, rewardCoins: chapter.rewardCoins, rewardDust: chapter.rewardDust, rewardCardId: chapter.rewardCardId, coins: user.coins, dust: user.dust, cardStats: user.cardStats });
});

app.post('/api/minigame/reward', authMiddleware, (req, res) => {
  const user = getUser(req.userId);
  user.coins += 250;
  user.dust += 25;
  user.stats.memoryCompleted += 1;
  saveDatabase();
  res.json({ coins: user.coins, dust: user.dust, rewardCoins: 250, rewardDust: 25, stats: user.stats });
});

app.post('/api/cards/fuse-specific', authMiddleware, (req, res) => {
  const { cardId } = req.body;
  const user = getUser(req.userId);
  const card = CARDS_DB.find(c => c.id === cardId);
  if (!card) return res.status(404).json({ error: 'Карта не найдена' });

  const count = user.inventory.filter(id => id === cardId).length;
  if (count < 3) return res.status(400).json({ error: 'Нужно минимум 3 одинаковых карты!' });

  const nextRarity = { 'Common': 'Rare', 'Rare': 'Epic', 'Epic': 'Legendary', 'Legendary': 'Mythic' }[card.rarity];
  if (!nextRarity) return res.status(400).json({ error: 'Mythic нельзя улучшить дальше' });

  let removed = 0;
  for (let i = user.inventory.length - 1; i >= 0 && removed < 3; i--) {
    if (user.inventory[i] === cardId) {
      user.inventory.splice(i, 1);
      removed++;
    }
  }

  const pool = CARDS_DB.filter(c => c.rarity === nextRarity);
  const resultCard = pool[Math.floor(Math.random() * pool.length)];
  user.inventory.push(resultCard.id);
  saveDatabase();
  res.json({ resultCard, inventory: user.inventory });
});

app.post('/api/cards/disenchant', authMiddleware, (req, res) => {
  const { cardId } = req.body;
  const user = getUser(req.userId);
  const idx = user.inventory.indexOf(cardId);
  if (idx === -1) return res.status(400).json({ error: 'Карта отсутствует' });

  const card = CARDS_DB.find(c => c.id === cardId);
  const dustMap = { Mythic: 900, Legendary: 350, Epic: 120, Rare: 40, Common: 10 };
  const dustReward = dustMap[card.rarity] || 15;
  user.inventory.splice(idx, 1);
  user.dust += dustReward;
  saveDatabase();
  res.json({ dust: user.dust, inventory: user.inventory });
});

app.get('/api/hunt', authMiddleware, (req, res) => {
  const user = getUser(req.userId);
  const activeQuest = TRIVIA_HUNT.find(q => !user.completedQuests.includes(q.id));
  if (!activeQuest) return res.json({ available: false, message: 'Все контракты выполнены!' });
  res.json({ available: true, quest: { id: activeQuest.id, clue: activeQuest.clue, options: activeQuest.options } });
});

app.post('/api/hunt/answer', authMiddleware, (req, res) => {
  const { questId, selectedIndex } = req.body;
  const user = getUser(req.userId);
  const quest = TRIVIA_HUNT.find(q => q.id === questId);
  if (!quest || user.completedQuests.includes(questId)) return res.status(400).json({ error: 'Квест не найден' });

  if (quest.correctIndex === selectedIndex) {
    user.completedQuests.push(questId);
    user.stats.questsCompleted += 1;
    const rewardCard = CARDS_DB.find(c => c.id === quest.rewardCardId);
    user.inventory.push(rewardCard.id);
    user.coins += 350;
    saveDatabase();
    res.json({ success: true, rewardCard, bonusCoins: 350, stats: user.stats });
  } else {
    res.json({ success: false, message: 'Неверно! Попробуйте еще раз.' });
  }
});

// ================= ВСТРОЕННЫЙ БОТ TELEGRAM =================
if (BOT_TOKEN) {
  const bot = new Telegraf(BOT_TOKEN);
  bot.start(async (ctx) => {
    const welcomeText =
`⚡️ <b>COLLECT CARDS: БИТВА ЛЕГЕНД</b> ⚡️

🎴 <b>Собирай элитные карты</b> чемпионов UFC, легенд футбола, рэперов и звезд кино!
⚔️ <b>Интерактивная Арена:</b> наноси удары, ставь блоки и используй суперсилы!
📜 <b>Сюжетная Кампания:</b> разгадывай тактику боссов и забирай редкие трофеи.
🎰 <b>Колесо Фортуны:</b> крути рулетку каждый день и выбивай джекпоты!

🎁 <i>Твой стартовый бонус уже ждет внутри!</i>`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.webApp('🔥 ИГРАТЬ В ОДИН КЛИК 🔥', process.env.WEBAPP_URL || WEBAPP_URL)],
      [Markup.button.switchToChat('👥 Позвать друга', 'Заходи в Collect Cards — собирай карты и выходи в октагон!')]
    ]);

    const posterPath = path.join(__dirname, 'public/images/khabib.png');
    try {
      if (fs.existsSync(posterPath)) {
        await ctx.replyWithPhoto({ source: posterPath }, { caption: welcomeText, parse_mode: 'HTML', ...keyboard });
      } else {
        await ctx.reply(welcomeText, { parse_mode: 'HTML', ...keyboard });
      }
    } catch (e) {
      console.error('Ошибка бота:', e);
    }
  });

  bot.launch().then(() => console.log('🤖 Встроенный Telegram-бот успешно запущен!'));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Единый игровой сервер запущен на порту ${PORT}`));