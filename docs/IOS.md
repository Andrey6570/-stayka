# Стайка на iPhone

Apple разрешает ставить приложения на iPhone только с подписью, поэтому вариантов три. Платный аккаунт у вас есть, поэтому основной путь — вариант 3 (TestFlight); варианты 1 и 2 работают без аккаунта.

## 1. Веб-версия на экране «Домой» (без Apple ID, бесплатно)

Сборка публикует приложение на GitHub Pages: **https://andrey6570.github.io/-stayka/**

1. Один раз включите Pages: репозиторий → **Settings → Pages → Source: GitHub Actions**. Затем запустите workflow «Web app (GitHub Pages)» (Actions → Run workflow) или сделайте любой commit.
2. На iPhone откройте ссылку в **Safari** → кнопка «Поделиться» → **На экран «Домой»**.
3. Приложение запустится в полноэкранном режиме с иконкой, работает офлайн, данные хранятся в Safari. Синхронизация через Firebase работает так же, как в APK.

Ограничения iOS для веб-версии: нет пункта «Стайка» в меню «Поделиться» из Google Карт (вставляйте ссылку в поле «Место на карте»); push-уведомления появятся позже и потребуют iOS 16.4+.

## 2. Неподписанный `.ipa` (бесплатный Apple ID, 7 дней)

Workflow «iOS app» собирает `stayka-unsigned.ipa` и кладёт в релиз **latest-ios** (и в артефакты запуска). Этот файл нужно подписать на вашем компьютере:

- **AltStore** (https://altstore.io) или **Sideloadly** (https://sideloadly.io): подключите iPhone, выберите файл `.ipa`, войдите своим Apple ID. Подпись живёт 7 дней, AltStore обновляет её сам, пока компьютер в той же сети.
- В iOS 16+ включите **Настройки → Конфиденциальность и безопасность → Режим разработчика**.

## 3. TestFlight (платный аккаунт Apple Developer): настроено

Workflow **«iOS to TestFlight»** (`.github/workflows/ios-testflight.yml`) собирает приложение, подписывает облачной подписью Apple и загружает в TestFlight. Работает так же, как у Talent Foxes. Один раз нужно:

1. **Приложение в App Store Connect:** App Store Connect → Apps → «+» → New App. Платформа iOS, имя «Стайка», **Bundle ID `com.andrey6570.stayka`** (если его нет в списке, сначала создайте в developer.apple.com → Identifiers), SKU любой, например `stayka`.
2. **Четыре секрета** в репозитории Стайки (Settings → Secrets and variables → Actions → New repository secret). Значения те же, что в репозитории Talent Foxes, ключ API Apple общий для всего аккаунта:
   - `APPLE_TEAM_ID`: Team ID (developer.apple.com → Membership details);
   - `ASC_KEY_ID`, `ASC_ISSUER_ID`: из App Store Connect → Users and Access → Integrations → Keys;
   - `ASC_KEY_P8`: текст файла `.p8` целиком (его скачивают один раз; если файла нет, создайте новый ключ с ролью App Manager или Admin).
3. **Запуск:** Actions → «iOS to TestFlight» → Run workflow. Через 10–20 минут сборка появится в App Store Connect → TestFlight (сначала со статусом обработки), её можно ставить через приложение TestFlight на iPhone, для себя как внутренний тестер.

Для внешних тестировщиков и публикации в App Store понадобятся адрес политики конфиденциальности (сейчас в приложении это черновик с незаполненными контактами), описание, скриншоты и анкета о данных.

## Что отличается от Android

- Bundle ID: `com.andrey6570.stayka`, минимальная iOS 15.
- Приём места из Google Карт через меню «Поделиться» работает только на Android (на iOS для этого нужно отдельное расширение Share Extension).
- Ссылки «На карте» и «Маршрут» открывают Google Карты (если установлены) или сайт.
