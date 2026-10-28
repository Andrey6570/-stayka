// Game catalogue. The cards live in src/games/*.js, one file per game, each an array of [ru, en, el]
// (trivia: [[q, a], [q, a], [q, a]] in the same order). The rules and card text are written for the level Google Play allows:
// provocative and personal for the 18+ talk games, but never sexual or explicit.
import never from "./games/never.js";
import likely from "./games/likely.js";
import truth from "./games/truth.js";
import trivia from "./games/trivia.js";
import twotruths from "./games/twotruths.js";
import charades from "./games/charades.js";
import dares from "./games/dares.js";
import deep from "./games/deep.js";
import spicy from "./games/spicy.js";
import confess from "./games/confess.js";

const X = (a, b, c) => ({ ru: a, en: b, el: c });
const TALK = "TALK";

export const GAMES = {
  never: { cat: "alc", name: X("Я никогда не…", "Never have I ever…", "Ποτέ δεν έχω…"), desc: X("Кто делал, тот делает глоток", "If you did it, you drink", "Όποιος το έχει κάνει, πίνει"),
    rule: X("Читайте утверждение вслух. Кто это делал, тот делает {d}.", "Read the statement aloud. Anyone who has done it takes {d}.", "Διαβάστε τη φράση φωναχτά. Όποιος το έχει κάνει, παίρνει {d}."),
    pre: X("Я никогда не ", "Never have I ever ", "Ποτέ δεν έχω "), cards: never },
  likely: { cat: "alc", name: X("Кто скорее всего…", "Most likely to…", "Ποιος είναι πιο πιθανό να…"), desc: X("Все показывают пальцем", "Everyone points", "Όλοι δείχνουν με το δάχτυλο"),
    rule: X("На счёт «три» все показывают на одного человека. Кого выбрали чаще всех, тот делает {d}.", "On three, everyone points at one person. The most pointed-at person takes {d}.", "Στο «τρία» όλοι δείχνουν έναν άνθρωπο. Όποιος πάρει τις περισσότερες ψήφους παίρνει {d}."),
    pre: X("Кто скорее всего ", "Who is most likely to ", "Ποιος είναι πιο πιθανό να "), post: X("?", "?", ";"), cards: likely },
  truth: { cat: "alc", name: X("Правда или тост", "Truth or toast", "Αλήθεια ή πρόποση"), desc: X("Ответь честно или выпей", "Answer honestly or drink", "Απάντησε ειλικρινά ή πιες"),
    rule: X("Ответьте честно или сделайте {d}. Достаточно короткого ответа.", "Answer honestly or take {d}. A short answer is enough.", "Απαντήστε ειλικρινά ή πάρτε {d}. Αρκεί μια σύντομη απάντηση."), cards: truth },
  trivia: { cat: "mind", trivia: true, name: X("Викторина", "Trivia", "Κουίζ"), desc: X("Вопросы с ответами", "Questions with answers", "Ερωτήσεις με απαντήσεις"),
    rule: X("Ведущий читает вопрос, остальные отвечают. Потом нажмите «Показать ответ». Очки ведите сами.", "The host reads the question, the others answer. Then tap “Show answer”. Keep score yourselves.", "Ο παρουσιαστής διαβάζει την ερώτηση, οι άλλοι απαντούν. Μετά πατήστε «Εμφάνιση απάντησης». Κρατήστε μόνοι σας το σκορ."), cards: trivia },
  twotruths: { cat: "mind", name: X("Две правды и ложь", "Two truths and a lie", "Δύο αλήθειες και ένα ψέμα"), desc: X("Угадай, где ложь", "Spot the lie", "Βρες το ψέμα"),
    rule: X("Назовите три факта о себе по теме: два правдивых и один выдуманный. Остальные угадывают ложь.", "Share three facts about yourself on the topic: two true, one made up. The others guess the lie.", "Πείτε τρία γεγονότα για εσάς με αυτό το θέμα: δύο αληθινά και ένα φανταστικό. Οι άλλοι μαντεύουν το ψέμα."),
    pre: X("Тема: ", "Topic: ", "Θέμα: "), cards: twotruths },
  charades: { cat: "mix", name: X("Крокодил", "Charades", "Παντομίμα"), desc: X("Покажи слово без слов", "Act out the word", "Παίξε τη λέξη"),
    rule: X("Покажите слово жестами, без звуков. Угадали, это очко команде. Не угадали, значит {d}.", "Act out the word with no sounds. Guessed means a point. Not guessed means {d}.", "Παίξτε τη λέξη με χειρονομίες, χωρίς ήχους. Αν τη βρουν, παίρνετε πόντο. Αλλιώς πάρτε {d}."), cards: charades },
  quizpen: { cat: "mix", trivia: true, name: X("Викторина со штрафом", "Trivia with a penalty", "Κουίζ με ποινή"), desc: X("Ошибся, значит штраф", "Wrong answer, penalty", "Λάθος απάντηση, ποινή"),
    rule: X("Вопросы как в викторине. Кто ответил неверно, делает {d}.", "Same questions as trivia. Anyone who answers wrong takes {d}.", "Οι ίδιες ερωτήσεις με το κουίζ. Όποιος απαντήσει λάθος παίρνει {d}."), cards: trivia },
  dares: { cat: "mix", name: X("Челленджи", "Dares", "Προκλήσεις"), desc: X("Выполни или штраф", "Do it or take a penalty", "Κάν' το ή πάρε ποινή"),
    rule: X("Выполните задание или сделайте {d}.", "Do the task or take {d}.", "Κάντε την πρόκληση ή πάρτε {d}."), cards: dares },
  deep: { cat: "talk", name: X("Глубокие вопросы", "Deep questions", "Βαθιές ερωτήσεις"), desc: X("Разговор по душам", "A heart-to-heart", "Κουβέντα απ' την καρδιά"), rule: TALK, cards: deep },
  spicy: { cat: "talk", name: X("Острые вопросы", "Spicy questions", "Καυτές ερωτήσεις"), desc: X("Провокационно, но без пошлости", "Provocative, never crude", "Προκλητικές, χωρίς χοντράδες"), rule: TALK, cards: spicy },
  confess: { cat: "talk", name: X("Признания и задания", "Confessions and tasks", "Εξομολογήσεις και αποστολές"), desc: X("Откровенно, но бережно", "Honest, but gentle", "Ειλικρινά, αλλά με προσοχή"), rule: TALK, cards: confess }
};
export const CATS = [
  { id: "alc", name: X("С алкоголем", "Drinking games", "Με αλκοόλ"), adult: true, ids: ["never", "likely", "truth"] },
  { id: "mind", name: X("Для ума", "Brain games", "Για το μυαλό"), adult: false, ids: ["trivia", "twotruths"] },
  { id: "mix", name: X("Микс", "Mixed", "Μίξ"), adult: false, ids: ["charades", "quizpen", "dares"] },
  { id: "talk", name: X("18+ Разговоры", "18+ Conversations", "18+ Συζητήσεις"), adult: true, ids: ["deep", "spicy", "confess"] }
];
export const LI = { ru: 0, en: 1, el: 2 };
export const cardsOf = id => GAMES[id].cards;
export const isAdult = id => { const c = GAMES[id].cat; return c === "alc" || c === "talk"; };
export const cardText = (id, card, lang) => { const g = GAMES[id]; return (g.pre ? g.pre[lang] : "") + card[LI[lang]] + (g.post ? g.post[lang] : ""); };
