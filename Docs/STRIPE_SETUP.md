# Stripe: покрокова налаштання

Щоб кнопка «Unlock Full Plan» відкривала оплату, потрібно додати ключ Stripe в два місця: локально (для тестів на комп’ютері) і в Netlify (для сайту scoopysleep.netlify.app).

---

## Частина 1. Отримати ключі в Stripe

### Крок 1.1. Увійти в Stripe

1. Відкрий у браузері: **https://dashboard.stripe.com**
2. Увійди в свій акаунт (або зареєструйся).

### Крок 1.2. Відкрити сторінку API-ключів

1. У лівому меню натисни **«Developers»** (Розробники).
2. Далі натисни **«API keys»** (API ключі).

### Крок 1.3. Скопіювати Secret key

1. На сторінці побачиш два ключі:
   - **Publishable key** (починається з `pk_test_` або `pk_live_`) — для фронтенду, зараз не використовується.
   - **Secret key** (починається з `sk_test_` або `sk_live_`) — **саме його потрібно**.
2. Напроти **Secret key** натисни **«Reveal test key»** (або «Reveal live key»).
3. Натисни **«Copy»** — ключ скопіюється в буфер (виглядає приблизно так: `sk_test_51T5ONe...`).

Цей ключ далі вставляємо локально і в Netlify.

---

## Частина 2. Локально (на твоєму комп’ютері)

Щоб при натисканні «Unlock Full Plan» на **localhost** не було помилки «Stripe is not configured».

### Крок 2.1. Відкрити папку проєкту

1. Відкрий у Finder папку: **Desktop → scoopy_sleep**  
   (або той шлях, де у тебе лежить проєкт).

### Крок 2.2. Створити файл .env.local

1. У корені папки **scoopy_sleep** (поруч з `package.json`, `src`, `public`) створи **новий файл**.
2. Назва файлу **рівно**: **`.env.local`**  
   (з крапкою на початку, без пробілів, розширення `.env.local`).
3. Якщо не виходить створити файл з крапки:
   - Відкрий «Термінал», перейди в папку:  
     `cd ~/Desktop/scoopy_sleep`
   - Виконай:  
     `touch .env.local`  
   - Потім відкрий цей файл у Cursor або TextEdit.

### Крок 2.3. Вставити ключ у .env.local

1. Відкрий файл **`.env.local`**.
2. Встав у нього один рядок (підстав свій скопійований ключ):

```
STRIPE_SECRET_KEY=sk_test_тут_твій_ключ
```

Приклад (не копіюй — використай свій ключ з Stripe):

```
STRIPE_SECRET_KEY=sk_test_51T5ONeAGYtMyrNuF...
```

3. Збережи файл (Cmd+S).

### Крок 2.4. Перезапустити сайт

1. Якщо сайт уже запущений («Start Site.command» або `npm run dev`) — зупини його (закрий термінал або Ctrl+C).
2. Запусти знову («Start Site.command» або `npm run dev`).
3. Відкрий у браузері сторінку з формою сну і знову натисни **«Unlock Full Plan»** — має відкритися Stripe Checkout (тестовий режим).

---

## Частина 3. Netlify (сайт scoopysleep.netlify.app)

Щоб оплата працювала на **живому сайті**, а не тільки на localhost.

### Крок 3.1. Відкрити налаштування сайту в Netlify

1. Відкрий у браузері: **https://app.netlify.com**
2. Увійди в акаунт.
3. У списку сайтів вибери сайт **scoopysleep** (scoopysleep.netlify.app).

### Крок 3.2. Відкрити змінні середовища

1. У верхньому меню сайту натисни **«Site configuration»** (або «Site settings»).
2. У лівому меню вибери **«Environment variables»** (Змінні середовища).

### Крок 3.3. Додати STRIPE_SECRET_KEY

1. Натисни **«Add a variable»** / **«Add variable»** / **«New variable»**.
2. **Key (ім’я):** введи рівно  
   `STRIPE_SECRET_KEY`
3. **Value (значення):** встав свій **Secret key** з Stripe (той самий, що в .env.local, або live-ключ для продакшену).
4. **Scopes:** залиш **All** (або «All scopes»), щоб змінна була для всіх деплоїв.
5. Натисни **«Create»** або **«Save»**.

### Крок 3.4. (Рекомендовано) Додати URL сайту

1. Ще раз **«Add a variable»**.
2. **Key:**  
   `NEXT_PUBLIC_APP_URL`
3. **Value:**  
   `https://scoopysleep.netlify.app`
4. Збережи.

Це потрібно, щоб після оплати Stripe повертав користувача на твій сайт, а не на localhost.

### Крок 3.5. Перезапустити деплой

1. У верхньому меню сайту відкрий **«Deploys»**.
2. Натисни **«Trigger deploy»** → **«Deploy site»** (або «Clear cache and deploy»).
3. Дочекайся завершення збірки.

Після цього на **https://scoopysleep.netlify.app** кнопка «Unlock Full Plan» має відкривати Stripe Checkout без помилки «Stripe is not configured».

---

## Коротко

| Де        | Що зробити |
|----------|-------------|
| **Stripe** | Developers → API keys → скопіювати **Secret key** (sk_test_...). |
| **Локально** | У папці scoopy_sleep створити `.env.local`, вставити `STRIPE_SECRET_KEY=sk_test_...`, перезапустити сайт. |
| **Netlify** | Site configuration → Environment variables → додати `STRIPE_SECRET_KEY` і `NEXT_PUBLIC_APP_URL=https://scoopysleep.netlify.app` → Trigger deploy. |

Файл `.env.local` не заливається в Git — ключ лишається тільки на твоєму комп’ютері. У Netlify ключ зберігається в налаштуваннях сайту і теж не потрапляє в репозиторій.

---

## Частина 4. Webhook (щоб після оплати з’являвся план)

Якщо після оплати сторінка показує «Loading your plan…» і план так і не з’являється, а в Upstash Data Browser нічого немає — значить **Stripe webhook не налаштований**. Саме webhook після оплати запускає генерацію плану і зберігає його в Redis.

### Крок 4.1. Stripe Dashboard → Webhooks

1. Відкрий **https://dashboard.stripe.com/webhooks**
2. Натисни **«Add endpoint»**.

### Крок 4.2. URL endpoint

1. **Endpoint URL:** введи  
   `https://scoopysleep.netlify.app/api/stripe/webhook`
2. **Events to send:** вибери **«Select events»** і постав галочку **`checkout.session.completed`**.
3. Збережи endpoint.

### Крок 4.3. Скопіювати Signing secret

1. Відкрий створений endpoint (клік по URL).
2. У блоці **«Signing secret»** натисни **«Reveal»** і скопіюй значення (починається з `whsec_...`).

### Крок 4.4. Додати в Netlify

1. Netlify → сайт **scoopysleep** → **Site configuration** → **Environment variables**.
2. **Add a variable** → **Key:** `STRIPE_WEBHOOK_SECRET`, **Value:** вставлений `whsec_...`.
3. Збережи. Зроби **Trigger deploy**.

Після цього при кожній успішній оплаті Stripe викликатиме твій URL, бекенд згенерує план, збереже його в Upstash Redis, і сторінка `/sleep?session_id=...` зможе його показати (а якщо налаштуєш Resend — і лист з планом і magic link прийде на пошту).

---

## Якщо в Event destinations «No event deliveries found»

Якщо ти налаштував **Developers → Event destinations → scoopy_sleep** і бачиш **«No event deliveries found»**, це означає, що Stripe ще **ні разу не надсилав** події на цей endpoint.

Перевір:

1. **Режим (Test / Live)**  
   У лівому нижньому куті Stripe Dashboard переконайся, що обрано **Test mode** (якщо тестуєш тестовими картками). Події в Test mode надсилаються тільки для тестових подій; destination має бути доступний у тому ж режимі.

2. **Події для destination**  
   У destination **scoopy_sleep** у блоці **«Selected events»** має бути обрано **`checkout.session.completed`** і зміни збережені.

3. **URL endpoint**  
   URL має бути рівно:  
   `https://scoopysleep.netlify.app/api/stripe/webhook`  
   (без слеша в кінці, https).

4. **Щоб з’явилися deliveries**  
   Зроби **новий** тестовий платіж (після збереження destination): заповни форму на сайті → Unlock → оплати тестовою карткою. Після цього в **Event destinations → scoopy_sleep** мають з’явитися доставки (Recent deliveries). Якщо їх досі немає — перевір, що ключі в Netlify тестові (`sk_test_...`) і що деплой з `STRIPE_WEBHOOK_SECRET` уже виконано.
